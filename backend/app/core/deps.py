from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User, UserRole
from app.repositories.user_repository import UserRepository
from app.core.security import decode_token
from app.exceptions.base import UnauthorizedError, ForbiddenError

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if creds is None:
        raise UnauthorizedError("Missing authentication token.", code="MISSING_TOKEN")
    try:
        payload = decode_token(creds.credentials)
    except JWTError:
        raise UnauthorizedError("Invalid or expired token.", code="INVALID_TOKEN")
    if payload.get("type") != "access":
        raise UnauthorizedError("Token is not an access token.", code="INVALID_TOKEN_TYPE")
    user = UserRepository(db).get_by_id(int(payload["sub"]))
    if not user:
        raise UnauthorizedError("User no longer exists.", code="USER_NOT_FOUND")
    return user


def require_roles(*allowed: UserRole):
    def _checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise ForbiddenError(f"Role {user.role.value} cannot access this resource.", code="ROLE_FORBIDDEN")
        return user
    return _checker
