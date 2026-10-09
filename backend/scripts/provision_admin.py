"""
Kivora Production Admin Provisioning CLI
Allows administrators to securely create or promote an admin account in production
without exposing credentials in public source code or repository seeds.

Usage:
    python backend/scripts/provision_admin.py --email admin@kivora.com --name "Kivora Administrator"
"""

import sys
import os
import getpass
import argparse
import uuid
from pathlib import Path
from datetime import datetime

# Set up path so imports work when running from project root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.database import SessionLocal, Base, engine
from backend.app.core.security import hash_password
from backend.app.models.models import User, BrandProfile


def provision_admin(email: str, name: str, password: str = None):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        clean_email = email.strip().lower()
        existing_user = db.query(User).filter(User.email == clean_email).first()

        if existing_user:
            print(f"[*] User {clean_email} already exists (Current role: {existing_user.role}).")
            existing_user.role = "ADMIN"
            existing_user.is_email_verified = True
            if password:
                existing_user.hashed_password = hash_password(password)
                print(f"[+] Updated password for {clean_email}.")
            db.commit()
            print(f"[SUCCESS] User {clean_email} has been granted ADMIN privileges.")
            return

        if not password:
            password = getpass.getpass(prompt=f"Enter secure password for new admin ({clean_email}): ")
            confirm = getpass.getpass(prompt="Confirm password: ")
            if password != confirm:
                print("[ERROR] Passwords do not match.")
                sys.exit(1)

        admin_user = User(
            id=f"user-{uuid.uuid4().hex[:10]}",
            email=clean_email,
            hashed_password=hash_password(password),
            role="ADMIN",
            is_email_verified=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(admin_user)
        db.commit()
        print(f"[SUCCESS] Admin account created successfully for {clean_email} (ID: {admin_user.id}).")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to provision admin: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Provision a Kivora Admin Account")
    parser.add_argument("--email", required=True, help="Email address for the admin account")
    parser.add_argument("--name", default="Admin", help="Display name for the admin account")
    parser.add_argument("--password", help="Optional plain password (prompts securely if omitted)")

    args = parser.parse_args()
    provision_admin(email=args.email, name=args.name, password=args.password)
