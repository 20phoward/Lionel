from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import User
from dependencies import get_db, get_current_user, require_admin
from models.schemas import UserResponse

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(User).all()
