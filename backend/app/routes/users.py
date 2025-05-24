from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.db.session import get_session
from app.models.user import User
from app.schemas.user import UserCreate, UserRead
from typing import List

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/", response_model=UserRead)
async def create_user(user: UserCreate, session: AsyncSession = Depends(get_session)):
    db_user = User(email=user.email)
    session.add(db_user)
    try:
        await session.commit()
        await session.refresh(db_user)
        return db_user
    except IntegrityError as e:
        await session.rollback()
        if (
            "unique constraint" in str(e.orig).lower()
            or "duplicate key" in str(e.orig).lower()
        ):
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=400, detail="Database integrity error")
    except Exception:
        await session.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/", response_model=List[UserRead])
async def list_users(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User))
    return result.scalars().all()
