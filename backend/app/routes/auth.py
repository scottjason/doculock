from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_session
from app.models.user import User


class EmailCheckRequest(BaseModel):
    email: EmailStr


router = APIRouter(prefix="/api/auth")


@router.post("/check-email")
async def check_email(
    request: EmailCheckRequest, session: AsyncSession = Depends(get_session)
):
    try:
        stmt = select(User).where(User.email == request.email)
        result = await session.execute(stmt)
        user = result.scalars().first()
        return {"exists": bool(user)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking email: {e}")
