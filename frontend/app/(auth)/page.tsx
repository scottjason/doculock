'use client';
import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { checkEmail, registerPasskey } from '../requests/authRequests';

export default function Authenticate() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'main' | 'passkey'>('main');

  async function onEmailSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    const result = await checkEmail(email);
    if (!result) {
      console.log('Email does not exist, proceeding to passkey registration');
      registerPasskey(email);
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
