
import getpass
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url

url = getpass.getpass(
    "Paste NEW Render External Database URL (hidden): "
).strip()

if make_url(url).get_backend_name() != "postgresql":
    raise SystemExit("ERROR: This must be a PostgreSQL URL.")

engine = create_engine(url, pool_pre_ping=True)

changes = [
    ("briefs", "creative_style_mood"),
    ("brief_skills", "id"),
    ("brief_tools", "id"),
    ("creator_skills", "id"),
    ("creator_tools", "id"),
]

try:
    with engine.begin() as conn:
        for table, column in changes:
            conn.exec_driver_sql(
                f'ALTER TABLE "{table}" '
                f'ALTER COLUMN "{column}" TYPE TEXT'
            )
            print(f"Updated {table}.{column} -> TEXT")

    print("\nSchema update completed successfully.")

except Exception as exc:
    print("\nSchema update failed; transaction rolled back.")
    print(type(exc).__name__, str(exc))
    raise

finally:
    engine.dispose()
