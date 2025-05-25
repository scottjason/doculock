import os
import jwt
import uuid
import base64
import traceback
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr
from sqlalchemy.future import select
from fastapi import APIRouter, Depends, HTTPException
from app.db.session import get_session
from app.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession

from webauthn import (
    verify_registration_response,
)
from webauthn.helpers.structs import (
    RegistrationCredential,
    AuthenticatorAttestationResponse,
)

router = APIRouter(prefix="/api/auth")

# In-memory registration challenge store
pending_registrations = {}


def save_registration_challenge(user_id, challenge):
    pending_registrations[user_id] = challenge


def get_registration_challenge(user_id):
    return pending_registrations.get(user_id)


class EmailCheckRequest(BaseModel):
    email: EmailStr


class RegisterPasskeyRequest(BaseModel):
    email: EmailStr


class RegisterPasskeyVerifyRequest(BaseModel):
    email: EmailStr
    user_id: str
    credential: dict


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


@router.post("/passkey/register/options")
async def register_passkey(request: RegisterPasskeyRequest):
    try:
        email = request.email
        user_id = str(uuid.uuid4())
        # Create a random challenge (WebAuthn requires base64url, no padding)
        challenge = os.urandom(32)
        challenge_b64 = base64.urlsafe_b64encode(challenge).rstrip(b"=").decode("utf-8")
        save_registration_challenge(user_id, challenge)
        options = {
            "challenge": challenge_b64,
            "rp": {
                "name": "DocuLock",
                "id": os.getenv("WEBAUTHN_RP_ID", "localhost"),
            },
            "user": {
                "id": base64.urlsafe_b64encode(user_id.encode()).decode(),
                "name": email,
                "displayName": email,
            },
            "pubKeyCredParams": [
                {"alg": -7, "type": "public-key"},  # ES256
                {"alg": -257, "type": "public-key"},  # RS256
            ],
            "authenticatorSelection": {
                "userVerification": "preferred",
            },
            "timeout": 60000,
            "attestation": "none",
        }
        return {"user_id": user_id, "options": options}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error registering passkey: {e}")


@router.post("/passkey/register/verify")
async def verify_passkey_registration(
    request: RegisterPasskeyVerifyRequest,
    session: AsyncSession = Depends(get_session),
):
    try:
        challenge = get_registration_challenge(request.user_id)
        if not challenge:
            print("Challenge not found for user_id:", request.user_id)
            print("Current pending_registrations:", pending_registrations)
            raise HTTPException(
                status_code=400, detail="Registration challenge expired or not found."
            )

        cred = request.credential

        def decode_b64url(data: str) -> bytes:
            padding = "=" * (4 - (len(data) % 4)) if (len(data) % 4) else ""
            return base64.urlsafe_b64decode(data + padding)

        # Extract credential parts
        attestation_object = decode_b64url(cred["response"]["attestationObject"])
        client_data_json = decode_b64url(cred["response"]["clientDataJSON"])
        raw_id = decode_b64url(cred["rawId"])
        challenge = get_registration_challenge(request.user_id)
        registration_verification = verify_registration_response(
            credential=RegistrationCredential(
                id=cred["id"],
                raw_id=raw_id,
                response=AuthenticatorAttestationResponse(
                    client_data_json=client_data_json,
                    attestation_object=attestation_object,
                ),
                type=cred["type"],
            ),
            expected_challenge=challenge,
            expected_rp_id=os.getenv("WEBAUTHN_RP_ID", "localhost"),
            expected_origin=os.getenv("WEBAUTHN_ORIGIN", "http://localhost:3000"),
            require_user_verification=False,
        )

        user = User(
            email=request.email,
            credential_id=cred["id"],
            public_key=registration_verification.credential_public_key.hex(),  # as hex string
        )
        session.add(user)
        await session.commit()

        # Remove challenge from in-memory store
        pending_registrations.pop(request.user_id, None)

        # create JWT token
        payload = {
            "sub": str(user.id),
            "email": user.email,
            "exp": datetime.utcnow() + timedelta(days=7),  # 7 day expiry
        }

        JWT_ALGORITHM = "HS256"
        JWT_SECRET = os.getenv("JWT_SECRET")
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return {"success": True, "token": token}
    except Exception as e:
        print("Exception in /passkey/register/verify:", e)
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Passkey verification failed: {e}")
