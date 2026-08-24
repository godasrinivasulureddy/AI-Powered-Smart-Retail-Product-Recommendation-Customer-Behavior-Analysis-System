from jose import JWTError
from sqlalchemy.orm import Session

from app.db.models import UserRole
from app.repositories.user_repository import UserRepository
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.exceptions.base import ConflictError, UnauthorizedError


class AuthService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)

    def register(self, email: str, password: str, role: UserRole):
        if self.repo.get_by_email(email):
            raise ConflictError("A user with this email already exists.", code="EMAIL_TAKEN")
        user = self.repo.create(email=email, password_hash=hash_password(password), role=role)
        return user

    def login(self, email: str, password: str) -> tuple[str, str]:
        user = self.repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedError("Invalid email or password.", code="INVALID_CREDENTIALS")
        return (
            create_access_token(str(user.id), user.role.value),
            create_refresh_token(str(user.id), user.role.value),
        )

    def refresh(self, refresh_token: str) -> str:
        try:
            payload = decode_token(refresh_token)
        except JWTError:
            raise UnauthorizedError("Invalid or expired refresh token.", code="INVALID_REFRESH_TOKEN")
        if payload.get("type") != "refresh":
            raise UnauthorizedError("Token is not a refresh token.", code="INVALID_TOKEN_TYPE")
        user = self.repo.get_by_id(int(payload["sub"]))
        if not user:
            raise UnauthorizedError("User no longer exists.", code="USER_NOT_FOUND")
        return create_access_token(str(user.id), user.role.value)
