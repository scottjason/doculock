import os
import uuid
from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    UploadFile,
    File as FastAPIFile,
    Form,
    APIRouter,
)
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.models.user import User
from app.models.file import File
from app.models.shared_file import SharedFile
from app.schemas.user import UserCreate, UserRead
from app.schemas.file import FileCreate, FileRead
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from datetime import datetime
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response


class SecureHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["Cache-Control"] = "no-store"
        response.headers["Content-Security-Policy"] = "frame-ancestors 'none'"
        response.headers["Content-Type"] = "application/json"
        response.headers["Strict-Transport-Security"] = (
            "max-age=63072000; includeSubDomains; preload"
        )
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        return response


app = FastAPI(title="DocuLock API")
app.add_middleware(SecureHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")


@api_router.get("/health")
async def health_check():
    return {"status": "ok"}


@api_router.post("/users/", response_model=UserRead)
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


@api_router.get("/users/", response_model=List[UserRead])
async def list_users(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User))
    return result.scalars().all()


UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@api_router.post("/files/", response_model=FileRead)
async def upload_file(
    owner_id: uuid.UUID = Form(...),
    file: UploadFile = FastAPIFile(...),
    session: AsyncSession = Depends(get_session),
):
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())
    db_file = File(
        owner_id=owner_id,
        filename=file.filename,
        content_type=file.content_type,
        path=file_location,
        uploaded_at=datetime.utcnow(),
        is_shared=False,
    )
    session.add(db_file)
    await session.commit()
    await session.refresh(db_file)
    return db_file


@api_router.get("/files/", response_model=List[FileRead])
async def list_files(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(File))
    return result.scalars().all()


app.include_router(api_router)
