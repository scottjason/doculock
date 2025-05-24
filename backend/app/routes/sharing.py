import uuid
from fastapi import (
    Body,
    Path,
    Depends,
    HTTPException,
    APIRouter,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.models.file import File
from app.models.shared_file import SharedFile


router = APIRouter(prefix="/api", tags=["sharing"])


@router.post("/files/{file_id}/share")
async def share_file(
    file_id: uuid.UUID = Path(...),
    user_id: uuid.UUID = Body(None),
    guest_email: str = Body(None),
    session: AsyncSession = Depends(get_session),
):
    db_file = await session.get(File, file_id)
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    if not user_id and not guest_email:
        raise HTTPException(
            status_code=400, detail="Must provide user_id or guest_email"
        )
    share = SharedFile(file_id=file_id, user_id=user_id, guest_email=guest_email)
    session.add(share)
    await session.commit()
    await session.refresh(share)
    return {"msg": "File shared", "share_id": str(share.id)}


@router.get("/files/{file_id}/shared-with")
async def get_file_shares(
    file_id: uuid.UUID = Path(...), session: AsyncSession = Depends(get_session)
):
    result = await session.execute(
        select(SharedFile).where(SharedFile.file_id == file_id)
    )
    shares = result.scalars().all()
    return [
        {
            "share_id": str(share.id),
            "user_id": str(share.user_id) if share.user_id else None,
            "guest_email": share.guest_email,
        }
        for share in shares
    ]


@router.get("/shared-with-me")
async def files_shared_with_me(
    user_id: uuid.UUID, session: AsyncSession = Depends(get_session)
):
    result = await session.execute(
        select(SharedFile).where(SharedFile.user_id == user_id)
    )
    shared = result.scalars().all()
    file_ids = [share.file_id for share in shared]
    if not file_ids:
        return []
    files_result = await session.execute(select(File).where(File.id.in_(file_ids)))
    return files_result.scalars().all()
