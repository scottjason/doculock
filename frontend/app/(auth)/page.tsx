'use client';
import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

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

export default function Authenticate() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'main' | 'passkey'>('main');

  const base64urlToUint8Array = (base64urlString: string): Uint8Array => {
    const base64 =
      base64urlString.replace(/-/g, '+').replace(/_/g, '/') +
      '='.repeat((4 - (base64urlString.length % 4)) % 4);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  function bufferToBase64url(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  const checkEmail = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        // Optionally handle/log error here
        return false;
      }
      const data = await response.json();
      return data.exists === true;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const registerPasskey = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register-passkey`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );
      if (!response.ok) {
        console.error('Error registering passkey:', response.statusText);
        setError('Failed to register passkey. Please try again.');
        setIsLoading(false);
      } else {
        const data = await response.json();
        console.log('Passkey registration response:', data);
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

        const registrationPayload: RegistrationPayload = {
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
        console.log('registration payload:', registrationPayload);
      }
    } catch (error) {
      console.error('Error during passkey registration:', error);
      setError('An error occurred while registering the passkey. Please try again.');
      setIsLoading(false);
    }
  };

  async function onEmailSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    const result = await checkEmail(email);
    if (!result) {
      console.log('Email does not exist, proceeding to passkey registration');
      registerPasskey();
    } else {
      console.log('Email exists, proceeding to passkey sign-in');
    }
  }

  async function onPasskeySignIn() {
    setError(null);
    setIsLoading(true);
    // If email is present, send to backend for passkey challenge
    // If no email, start discoverable credentials flow
  }

  useEffect(() => {
    const runHealthCheck = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/health`);
        if (!response.ok) {
          throw new Error('Server is not healthy');
        } else {
          console.log('Health check passed');
        }
      } catch (err) {
        console.error('Health check failed:', err);
        setError('Unable to connect to the server. Please try again later.');
      }
    };

    runHealthCheck();
  }, []);

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-[#111d28]'>
      <div className='flex w-full max-w-md flex-col gap-3 rounded-2xl border border-[#202f40] bg-[#172337]/80 p-8 shadow-lg'>
        <Header />
        {step === 'main' ? (
          <>
            <form onSubmit={onEmailSubmit} className='flex flex-col gap-4'>
              <input
                type='email'
                name='email'
                placeholder='Email'
                autoComplete='username'
                value={email}
                onChange={e => setEmail(e.target.value)}
                className='rounded-lg border border-[#253249] bg-[#101b26] px-4 py-3 text-white outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#4cce97]'
                required
                disabled={isLoading}
              />
              <button
                type='submit'
                className='rounded-xl bg-[#4cce97] py-3 font-semibold text-[#111d28] transition hover:bg-[#3c9e75] disabled:bg-[#294c3b]'
                disabled={isLoading}
              >
                <span className='text-black opacity-70'>
                  {isLoading ? 'Checking...' : 'Continue'}
                </span>
              </button>
            </form>
            <div className='relative my-2 flex w-full flex-row items-center'>
              <div className='flex-grow border-t border-[#294c3b]'></div>
              <span className='mx-3 text-xs text-gray-500'>or</span>
              <div className='flex-grow border-t border-[#294c3b]'></div>
            </div>
            <button
              type='button'
              className='w-full rounded-xl bg-[#4cce97] px-8 py-3 text-lg font-semibold text-[#111d28] transition hover:bg-[#3c9e75] disabled:bg-[#294c3b]'
              onClick={onPasskeySignIn}
              disabled={isLoading}
            >
              <span className='text-black opacity-70'>{'Sign in with Passkey'}</span>
            </button>
            {error && <div className='pt-2 text-center text-sm text-red-400'>{error}</div>}
          </>
        ) : (
          <div className='flex flex-col items-center gap-4'>
            <div className='text-lg font-semibold text-white'>{email}</div>
            <button
              type='button'
              className='rounded-xl bg-[#4cce97] px-8 py-3 text-lg font-semibold text-[#111d28] transition hover:bg-[#3c9e75] disabled:bg-[#294c3b]'
              onClick={onPasskeySignIn}
              disabled={isLoading}
            >
              {isLoading ? 'Starting Passkey...' : 'Sign in with Passkey'}
            </button>
            <button
              type='button'
              className='mt-2 text-xs font-semibold text-[#4cce97] underline'
              onClick={() => setStep('main')}
              disabled={isLoading}
            >
              Change email
            </button>
            {error && <div className='pt-2 text-center text-sm text-red-400'>{error}</div>}
          </div>
        )}

        <div className='mt-2 text-center text-sm text-gray-400'>
          Use your device passkey to sign in or register.
          <br />
          Enter your email for personalized accounts, or just sign in with your device.
        </div>
      </div>
      <Footer />
    </div>
  );
}
