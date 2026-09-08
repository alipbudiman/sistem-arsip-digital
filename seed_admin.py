#!/usr/bin/env python3
"""
Seed script to inject an initial master Admin account directly into MongoDB
for Sistem Arsip Digital - Kantor DPD RI Provinsi Sumatera Barat.
"""

import sys
import os
import argparse
from datetime import datetime, timezone

try:
    from pymongo import MongoClient
except ImportError:
    print("Error: 'pymongo' is not installed. Run: pip install pymongo")
    sys.exit(1)

try:
    import bcrypt
except ImportError:
    print("Error: 'bcrypt' is not installed. Run: pip install bcrypt")
    sys.exit(1)


def seed_admin(uri, username, password, nama_lengkap, role="admin", status="confirmed"):
    print("=" * 70)
    print("Sistem Arsip Digital - Kantor DPD RI Provinsi Sumatera Barat")
    print("Master Admin Bootstrap / Seeding Script")
    print("=" * 70)
    print(f"Connecting to MongoDB URI: {uri}")

    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        # Verify connection
        client.admin.command("ping")
        print("Connected to MongoDB successfully.")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        sys.exit(1)

    # Extract db name from URI or default to dpd_arsip_db
    db_name = "dpd_arsip_db"
    try:
        default_db = client.get_default_database()
        if default_db is not None:
            db_name = default_db.name
    except Exception:
        pass

    db = client[db_name]
    users_col = db["users"]

    # Hash the password with bcrypt (compatible with bcryptjs in Node.js)
    salt = bcrypt.gensalt(rounds=10)
    hashed_password = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    now = datetime.now(timezone.utc)

    existing_user = users_col.find_one({"username": username.lower()})

    if existing_user:
        print(f"\nUser '{username}' already exists in database (ID: {existing_user['_id']}).")
        print("Updating account to master 'admin' with 'confirmed' status...")
        users_col.update_one(
            {"_id": existing_user["_id"]},
            {
                "$set": {
                    "password": hashed_password,
                    "nama_lengkap": nama_lengkap,
                    "role": role,
                    "status": status,
                    "updated_at": now,
                }
            },
        )
        print("Account updated successfully!")
    else:
        new_admin = {
            "username": username.lower(),
            "password": hashed_password,
            "nama_lengkap": nama_lengkap,
            "role": role,
            "status": status,
            "created_at": now,
            "updated_at": now,
        }
        res = users_col.insert_one(new_admin)
        print(f"\nMaster Admin created successfully with ID: {res.inserted_id}")

    print("\n" + "-" * 70)
    print("LOGIN CREDENTIALS:")
    print(f"  Username : {username.lower()}")
    print(f"  Password : {password}")
    print(f"  Nama     : {nama_lengkap}")
    print(f"  Role     : {role}")
    print(f"  Status   : {status}")
    print("-" * 70)
    print("You can now log in at: http://localhost:3000/login\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Inject an admin account directly into MongoDB."
    )
    parser.add_argument(
        "--uri",
        default=os.getenv(
            "MONGODB_URI",
            "mongodb+srv://alifbudiman_db_user:Ek6ElbNc6PWttEkO@cluster0.v57ssra.mongodb.net/dpd_arsip_db?retryWrites=true&w=majority",
        ),
        help="MongoDB connection URI (default: mongodb+srv://alifbudiman_db_user:Ek6ElbNc6PWttEkO@cluster0.v57ssra.mongodb.net/dpd_arsip_db?retryWrites=true&w=majority)",
    )
    parser.add_argument(
        "--username",
        default="admin",
        help="Admin username (default: admin)",
    )
    parser.add_argument(
        "--password",
        default="AdminPassword123!",
        help="Admin password (default: AdminPassword123!)",
    )
    parser.add_argument(
        "--nama",
        default="Administrator Utama Kantor DPD RI Sumbar",
        help="Full name of admin",
    )

    args = parser.parse_args()
    seed_admin(
        uri=args.uri,
        username=args.username,
        password=args.password,
        nama_lengkap=args.nama,
    )
