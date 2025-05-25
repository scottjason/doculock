import { base64urlToUint8Array, bufferToBase64url } from '../utils/authUtil';

type RegistrationPayload = {
  email: string;
  user_id: string;
  credential: {
    id: string;
    rawId: string;
    type: string;
    response: {
      attestationObject: string;
      clientDataJSON: string;
    };
    authenticatorAttachment?: string;
  };
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const checkEmail = async (email: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/check-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.exists === true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e: unknown) {
    return false;
  }
};

export const registerPasskeyOptions = async (email: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/passkey/register/options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      console.error('Error registering passkey:', response.statusText);
    } else {
      const data = await response.json();
      const publicKey = {
        ...data.options,
        challenge: base64urlToUint8Array(data.options.challenge),
        user: {
          ...data.options.user,
          id: base64urlToUint8Array(data.options.user.id),
        },
      };
      // Initiate the WebAuthn credential creation
      const credential = (await navigator.credentials.create({
        publicKey,
      })) as PublicKeyCredential;

      const payload: RegistrationPayload = {
        email,
        user_id: data.user_id,
        credential: {
          id: credential.id,
          rawId: bufferToBase64url(credential.rawId),
          type: credential.type,
          response: {
            attestationObject: bufferToBase64url(
              (credential.response as AuthenticatorAttestationResponse).attestationObject
            ),
            clientDataJSON: bufferToBase64url(
              (credential.response as AuthenticatorAttestationResponse).clientDataJSON
            ),
          },
          authenticatorAttachment: credential.authenticatorAttachment ?? undefined,
        },
      };
      registerPasskeyVerify(payload);
      console.log('registration payload:', payload);
    }
  } catch (error) {
    console.error('Error during passkey registration:', error);
  }
};

export const registerPasskeyVerify = async (payload: RegistrationPayload): Promise<void> => {
  console.log(payload);
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/passkey/register/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error('Error verifying passkey:', response.statusText);
      throw new Error('Passkey verification failed');
    }
    const data = await response.json();
    console.log('Passkey registration successful:', data);
  } catch (error) {
    console.error('Error during passkey verification:', error);
  }
};
