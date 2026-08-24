from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenPair, RefreshRequest, UserOut
from app.schemas.envelope import Envelope
from app.services.auth_service import AuthService
from app.core.deps import get_current_user

router = APIRouter()


@router.post("/register", response_model=Envelope[UserOut], status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    user = AuthService(db).register(payload.email, payload.password, payload.role)
    return {"data": user, "error": None}


@router.post("/login", response_model=Envelope[TokenPair])
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    access, refresh = AuthService(db).login(payload.email, payload.password)
    return {"data": TokenPair(access_token=access, refresh_token=refresh), "error": None}


@router.post("/refresh", response_model=Envelope[TokenPair])
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    access = AuthService(db).refresh(payload.refresh_token)
    return {"data": TokenPair(access_token=access, refresh_token=payload.refresh_token), "error": None}


@router.post("/logout", status_code=204)
def logout(user=Depends(get_current_user)):
    return None
