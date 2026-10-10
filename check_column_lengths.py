
import getpass
from pathlib import Path

from sqlalchemy import MetaData, select, create_engine
from sqlalchemy.engine import make_url

root = Path(__file__).resolve().parent
source_path = root / "kivora.db"

url = getpass.getpass(
    "Paste NEW Render External Database URL (hidden): "
).strip()

if make_url(url).get_backend_name() != "postgresql":
    raise SystemExit("Error: URL must point to PostgreSQL.")

source_engine = create_engine(
    f"sqlite:///{source_path.as_posix()}"
)
target_engine = create_engine(url, pool_pre_ping=True)

try:
    source_meta = MetaData()
    target_meta = MetaData()

    with source_engine.connect() as src, target_engine.connect() as dst:
        source_meta.reflect(bind=src)
        target_meta.reflect(bind=dst)

        issues = 0

        for table_name, source_table in source_meta.tables.items():
            if table_name == "otp_codes":
                continue

            if table_name not in target_meta.tables:
                print(f"MISSING TABLE: {table_name}")
                continue

            target_table = target_meta.tables[table_name]

            if not source_table.primary_key.columns:
                continue

            pk_name = list(source_table.primary_key.columns)[0].name

            for column in source_table.columns:
                target_column = target_table.c.get(column.name)
                if target_column is None:
                    continue

                limit = getattr(target_column.type, "length", None)
                if not limit:
                    continue

                rows = src.execute(
                    select(source_table.c[pk_name], column).where(
                        column.is_not(None)
                    )
                )

                for row_id, value in rows:
                    if isinstance(value, str) and len(value) > limit:
                        print(
                            f"{table_name}.{column.name}: "
                            f"ID={row_id}, limit={limit}, "
                            f"actual_length={len(value)}"
                        )
                        issues += 1

        print(f"\nTotal oversized values found: {issues}")
        print("READ-ONLY CHECK: no records were changed.")

finally:
    source_engine.dispose()
    target_engine.dispose()
