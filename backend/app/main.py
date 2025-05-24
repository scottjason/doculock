import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response, APIRouter
from app.routes import users, files, sharing


class SecurityHeaders(BaseHTTPMiddleware):
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


allowed_origin = os.environ.get("ALLOWED_ORIGIN", "http://localhost:3000")

allowed_origins = [allowed_origin]

app = FastAPI(title="DocuLock API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SecurityHeaders)


health_router = APIRouter(prefix="/api")


@health_router.get("/health")
async def health_check():
    return {"status": "ok"}


app.include_router(health_router)
app.include_router(users.router)
app.include_router(files.router)
app.include_router(sharing.router)
