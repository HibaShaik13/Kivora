"""Safely migrate Kivora data from SQLite to PostgreSQL.
Default mode: preview only. Use --apply to insert missing records.
Existing PostgreSQL records are never updated or deleted. OTP codes are excluded.
"""
import argparse
import getpass
import json
import os
import sys
from pathlib import Path

from sqlalchemy import JSON, MetaData, create_engine, select
from sqlalchemy.engine import make_url
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

ROOT = Path(__file__).resolve().parent
SQLITE_PATH = ROOT / "kivora.db"
SKIP_TABLES = {"otp_codes"}

class MigrationAbort(Exception):
    """Raised when a migration safety check fails."""


def normalize(value):
    """Normalize common SQLite/PostgreSQL representation differences."""
    if isinstance(value, memoryview):
        return ("bytes", bytes(value).hex())
    if isinstance(value, bytes):
        return ("bytes", value.hex())
    if isinstance(value, (dict, list)):
        return json.dumps(value, sort_keys=True, default=str)
    if isinstance(value, str):
        stripped = value.strip()
        if stripped.startswith(("{", "[")):
            try:
                parsed = json.loads(stripped)
                if isinstance(parsed, (dict, list)):
                    return json.dumps(parsed, sort_keys=True, default=str)
            except (ValueError, TypeError):
                pass
    return value


def same_row(source_row, target_row, columns):
    return all(
        normalize(source_row.get(col)) == normalize(target_row.get(col))
        for col in columns
    )


def prepare_row_for_target(source_dict, target_table):
    """Decode SQLite JSON text before binding it to PostgreSQL JSON columns."""
    prepared = dict(source_dict)
    for name, column in target_table.columns.items():
        value = prepared.get(name)
        if value is None or not isinstance(value, str):
            continue
        if isinstance(column.type, JSON):
            try:
                prepared[name] = json.loads(value)
            except (ValueError, TypeError) as exc:
                raise MigrationAbort(
                    f"Invalid JSON in {target_table.name}.{name}; no data was committed."
                ) from exc
    return prepared


def unique_column_sets(target_table):
    """Return unique constraints/indexes without duplicate definitions."""
    unique_sets = []
    for constraint in target_table.constraints:
        if constraint.__class__.__name__ == "UniqueConstraint":
            names = [column.name for column in constraint.columns]
            if names:
                unique_sets.append(tuple(names))
    for index in target_table.indexes:
        if index.unique:
            names = [column.name for column in index.columns]
            if names:
                unique_sets.append(tuple(names))
    for column in target_table.columns:
        if column.unique:
            unique_sets.append((column.name,))
    return list(set(unique_sets))


def main():
    parser = argparse.ArgumentParser(
        description="Safely migrate Kivora data from SQLite to PostgreSQL."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Insert missing rows. Without this flag, only preview.",
    )
    args = parser.parse_args()

    if not SQLITE_PATH.is_file():
        sys.exit(f"Local database not found: {SQLITE_PATH}")

    print(f"Source SQLite database: {SQLITE_PATH}")
    print("Excluded table:", ", ".join(sorted(SKIP_TABLES)))
    print("Mode:", "APPLY" if args.apply else "PREVIEW ONLY")

    target_url = os.getenv("KIVORA_TARGET_DATABASE_URL")
    if not target_url:
        target_url = getpass.getpass(
            "Paste the NEW Render PostgreSQL External Database URL (input hidden): "
        ).strip()
    if not target_url:
        sys.exit("No database URL provided.")

    try:
        parsed_url = make_url(target_url)
    except Exception:
        sys.exit("Invalid database URL.")
    if parsed_url.get_backend_name() != "postgresql":
        sys.exit("Safety stop: target URL must point to PostgreSQL.")

    if args.apply:
        print("\nAPPLY mode: inserts only; existing records will not be updated or deleted.")
    else:
        print("\nPreview only. No destination records will be inserted.")

    source_engine = create_engine(f"sqlite:///{SQLITE_PATH.as_posix()}")
    target_engine = create_engine(target_url, pool_pre_ping=True)

    try:
        with source_engine.connect() as src, target_engine.connect() as dst:
            if dst.dialect.name != "postgresql":
                raise MigrationAbort("Safety stop: destination is not PostgreSQL.")

            src_meta = MetaData()
            src_meta.reflect(bind=src)
            dst_meta = MetaData()
            dst_meta.reflect(bind=dst)

            source_tables = set(src_meta.tables)
            destination_tables = set(dst_meta.tables)
            missing_tables = source_tables - destination_tables
            if missing_tables:
                raise MigrationAbort(
                    "Destination is missing tables: " + ", ".join(sorted(missing_tables))
                )

            ordered_tables = [
                table for table in src_meta.sorted_tables
                if table.name not in SKIP_TABLES
            ]

            for source_table in ordered_tables:
                target_table = dst_meta.tables[source_table.name]
                source_columns = set(source_table.columns.keys())
                destination_columns = set(target_table.columns.keys())
                if source_columns != destination_columns:
                    raise MigrationAbort(
                        f"Column mismatch in {source_table.name}. "
                        f"Source-only: {sorted(source_columns - destination_columns)}; "
                        f"destination-only: {sorted(destination_columns - source_columns)}"
                    )

            # SQLAlchemy 2.x autobegins a transaction for reflection/read queries.
            # Close that read transaction before explicitly opening the write transaction.
            if args.apply:
                dst.commit()
                transaction = dst.begin()
            else:
                transaction = None

            try:
                inserted_total = 0
                skipped_total = 0
                conflicts = []
                planned_unique_values = {}

                for source_table in ordered_tables:
                    table_name = source_table.name
                    target_table = dst_meta.tables[table_name]
                    columns = list(source_table.columns.keys())
                    pk_columns = [col.name for col in source_table.primary_key.columns]
                    if not pk_columns:
                        conflicts.append(f"{table_name}: no primary key; cannot safely migrate")
                        continue

                    rows = src.execute(select(source_table)).mappings().all()
                    inserted = 0
                    skipped = 0
                    unique_sets = unique_column_sets(target_table)
                    for unique_set in unique_sets:
                        planned_unique_values.setdefault((table_name, unique_set), {})

                    for source_row in rows:
                        source_dict = dict(source_row)
                        prepared_dict = prepare_row_for_target(source_dict, target_table)
                        pk_conditions = [
                            target_table.c[name] == source_dict[name]
                            for name in pk_columns
                        ]
                        existing = dst.execute(
                            select(target_table).where(*pk_conditions)
                        ).mappings().first()

                        if existing is not None:
                            if same_row(source_dict, dict(existing), columns):
                                skipped += 1
                            else:
                                conflicts.append(
                                    f"{table_name}: primary-key conflict "
                                    f"{tuple(source_dict[k] for k in pk_columns)} "
                                    "(existing row differs)"
                                )
                            continue

                        unique_conflict = False
                        for names in unique_sets:
                            values = tuple(source_dict.get(name) for name in names)
                            # PostgreSQL allows multiple NULLs in ordinary unique constraints.
                            if any(value is None for value in values):
                                continue
                            condition = [
                                target_table.c[name] == source_dict[name]
                                for name in names
                            ]
                            found = dst.execute(
                                select(target_table).where(*condition).limit(1)
                            ).first()
                            if found is not None:
                                conflicts.append(
                                    f"{table_name}: unique-value conflict on {list(names)}; "
                                    "existing row will not be changed"
                                )
                                unique_conflict = True
                                break
                            planned_key = (table_name, names)
                            seen = planned_unique_values[planned_key]
                            normalized_values = tuple(normalize(value) for value in values)
                            if normalized_values in seen and seen[normalized_values] != tuple(
                                source_dict.get(pk) for pk in pk_columns
                            ):
                                conflicts.append(
                                    f"{table_name}: duplicate source values for unique columns "
                                    f"{list(names)}; no rows from this migration will be committed"
                                )
                                unique_conflict = True
                                break
                            seen[normalized_values] = tuple(
                                source_dict.get(pk) for pk in pk_columns
                            )

                        if unique_conflict:
                            continue

                        if args.apply:
                            try:
                                dst.execute(target_table.insert().values(**prepared_dict))
                            except IntegrityError as exc:
                                raise MigrationAbort(
                                    f"Database constraint conflict in {table_name} for key "
                                    f"{tuple(source_dict[k] for k in pk_columns)}. "
                                    "The entire transaction will be rolled back."
                                ) from exc
                        inserted += 1

                    inserted_total += inserted
                    skipped_total += skipped
                    print(
                        f"{table_name}: {len(rows)} local rows, "
                        f"{inserted} {'to insert' if not args.apply else 'inserted'}, "
                        f"{skipped} identical rows to skip"
                    )

                if conflicts:
                    print("\nCONFLICTS FOUND:")
                    for conflict in conflicts[:100]:
                        print("-", conflict)
                    if len(conflicts) > 100:
                        print(f"... and {len(conflicts) - 100} more")
                    raise MigrationAbort("Resolve the conflicts before applying migration.")

                if transaction is not None:
                    transaction.commit()
                    print("\nTransaction committed.")

                print("\nSUMMARY")
                print("Rows to insert / inserted:", inserted_total)
                print("Identical existing rows skipped:", skipped_total)
                print("OTP codes migrated: 0")
                if not args.apply:
                    print("\nPreview only. Nothing was written.")
                    print("Review the output before running with --apply.")
            except Exception:
                if transaction is not None and transaction.is_active:
                    transaction.rollback()
                raise
    except (SQLAlchemyError, RuntimeError, MigrationAbort) as exc:
        sys.exit(f"\nMigration stopped safely: {exc}")
    finally:
        source_engine.dispose()
        target_engine.dispose()


if __name__ == "__main__":
    main()
