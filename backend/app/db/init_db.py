import asyncio
from app.db.session import engine
from app.models.base import Base
import app.models.user
import app.models.file
import app.models.shared_file


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


if __name__ == "__main__":
    asyncio.run(init_db())
