import os
import uuid
from datetime import datetime
from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File as FastAPIFile,
    Form,
    HTTPException,
    Response,
)
from app.schemas.file import FileCreate, FileRead
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_session
from app.models.file import File as FileModel
from typing import List

router = APIRouter(prefix="/api/files", tags=["files"])

UPLOAD_DIR = "../uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/", response_model=FileRead)
async def upload_file(
    owner_id: uuid.UUID = Form(...),
    file: UploadFile = FastAPIFile(...),
    session: AsyncSession = Depends(get_session),
):
    try:
        unique_name = f"{uuid.uuid4()}_{file.filename}"
        file_location = os.path.join(UPLOAD_DIR, unique_name)
        with open(file_location, "wb") as f:
            f.write(await file.read())
        db_file = FileModel(
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[FileRead])
async def list_files(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(FileModel))
    return result.scalars().all()


@router.get("/{file_id}/download")
async def download_file(
    file_id: uuid.UUID, session: AsyncSession = Depends(get_session)
):
    db_file = await session.get(FileModel, file_id)
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        with open(db_file.path, "rb") as f:
            file_data = f.read()
        return Response(
            content=file_data,
            media_type=db_file.content_type,
            headers={
                "Content-Disposition": f'attachment; filename="{db_file.filename}"'
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {e}")
