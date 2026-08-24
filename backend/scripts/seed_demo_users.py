import sys
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.db.session import SessionLocal
from app.db.models import User, UserRole
from app.core.security import hash_password


DEMO_USERS = [
    {"email": "admin@retail-ai.internal", "role": UserRole.ADMIN, "password": "password123"},
    {"email": "analyst@retail-ai.internal", "role": UserRole.ANALYST, "password": "password123"},
    {"email": "viewer@retail-ai.internal", "role": UserRole.VIEWER, "password": "password123"},
]


def seed_demo_users():
    db = SessionLocal()
    try:
        print("Seeding/updating demo user accounts...")
        for u in DEMO_USERS:
            existing = db.query(User).filter(User.email == u["email"]).first()
            password_hash = hash_password(u["password"])
            if existing:
                existing.password_hash = password_hash
                existing.role = u["role"]
                print(f"Updated existing user: {u['email']} (Role: {u['role'].value})")
            else:
                user = User(
                    email=u["email"],
                    password_hash=password_hash,
                    role=u["role"],
                )
                db.add(user)
                print(f"Created new user: {u['email']} (Role: {u['role'].value})")
        db.commit()
        print("Demo user seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding demo users: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_users()
