import os
import uuid
import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/api/auth")

# In-memory registration challenge store
pending_registrations = {}


def save_registration_challenge(user_id, challenge):
    pending_registrations[user_id] = challenge


class RegisterPasskeyRequest(BaseModel):
    email: EmailStr


@router.post("/register-passkey")
async def register_passkey(request: RegisterPasskeyRequest):
    try:
        email = request.email
        user_id = str(uuid.uuid4())
        # Create a random challenge (WebAuthn requires base64url, no padding)
        challenge = os.urandom(32)
        challenge_b64 = base64.urlsafe_b64encode(challenge).rstrip(b"=").decode("utf-8")
        save_registration_challenge(user_id, challenge_b64)
        options = {
            "challenge": challenge_b64,
            "rp": {
                "name": "Your App Name",
                "id": "localhost",  # Use your domain in production
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
