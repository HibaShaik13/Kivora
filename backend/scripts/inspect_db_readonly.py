import sqlite3
from pathlib import Path

def main():
    db_path = Path("kivora.db").resolve()
    print(f"Database Path: {db_path} (exists: {db_path.exists()})")

    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = sorted([r[0] for r in cursor.fetchall()])
    print(f"Tables ({len(tables)}): {tables}")

    for t in tables:
        if "verif" in t or "evidence" in t or "creator" in t or "user" in t or "claim" in t:
            cursor.execute(f"SELECT COUNT(*) FROM {t};")
            cnt = cursor.fetchone()[0]
            cursor.execute(f"PRAGMA table_info({t});")
            cols = [f"{col[1]} ({col[2]})" for col in cursor.fetchall()]
            print(f"\nTable '{t}' (count: {cnt}):")
            print(f"  Columns: {cols}")

    cursor.execute("SELECT id, email, role, is_email_verified FROM users WHERE role = 'ADMIN';")
    admins = cursor.fetchall()
    print(f"\nAdmin users: {admins}")

    conn.close()

if __name__ == "__main__":
    main()
