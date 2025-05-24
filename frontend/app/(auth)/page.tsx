'use client';
import { useEffect, useState } from 'react';
import { FaLock } from 'react-icons/fa';

export default function Authenticate() {
  const [step, setStep] = useState<'main' | 'passkey'>('main');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    // Optionally: validate email, call backend, etc.
    setTimeout(() => {
      setStep('passkey');
      setLoading(false);
    }, 400); // Simulate delay
  }

  async function onPasskeySignIn() {
    setError(null);
    setLoading(true);
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
        <div className='relative mb-6 flex flex-col items-center justify-center'>
          <FaLock className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-7xl text-white opacity-10' />
          <h1 className='relative z-10 text-center text-3xl font-bold text-white opacity-90'>
            DocuLock
          </h1>
        </div>

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
                disabled={loading}
              />
              <button
                type='submit'
                className='rounded-xl bg-[#4cce97] py-3 font-semibold text-[#111d28] transition hover:bg-[#3c9e75] disabled:bg-[#294c3b]'
                disabled={loading}
              >
                <span className='text-black opacity-70'>
                  {loading ? 'Checking...' : 'Continue'}
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
              disabled={loading}
            >
              <span className='text-black opacity-70'>
                {loading ? 'Starting Passkey...' : 'Sign in with Passkey'}
              </span>
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
              disabled={loading}
            >
              {loading ? 'Starting Passkey...' : 'Sign in with Passkey'}
            </button>
            <button
              type='button'
              className='mt-2 text-xs font-semibold text-[#4cce97] underline'
              onClick={() => setStep('main')}
              disabled={loading}
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
      <footer className='mt-6 text-xs text-gray-500'>© {new Date().getFullYear()} DocuLock</footer>
    </div>
  );
}
