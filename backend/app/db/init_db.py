from app.models.user import User
from app.db.session import engine
from sqlmodel import SQLModel
import asyncio


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


if __name__ == "__main__":
    asyncio.run(init_db())
