
import sqlite3
from pathlib import Path

db = Path("kivora.db")

if not db.exists():
    print("Database not found:", db.resolve())
else:
    connection = sqlite3.connect(str(db))
    tables = connection.execute(
        "SELECT name FROM sqlite_master "
        "WHERE type='table' AND name NOT LIKE 'sqlite_%' "
        "ORDER BY name"
    ).fetchall()

    print("\nLOCAL DATABASE TABLES AND RECORD COUNTS\n")

    for row in tables:
        name = row[0]
        count = connection.execute(
            'SELECT COUNT(*) FROM "' + name.replace('"', '""') + '"'
        ).fetchone()[0]
        print(f"{name}: {count} records")

    connection.close()
