import { Footer } from '../(auth)/components/Footer';

export default function Dashboard() {
  return (
    <div className='flex min-h-screen flex-col bg-[#111d28]'>
      <Navbar />
      <main className='flex flex-1 flex-col items-center justify-center'>
        <div className='mt-8 w-full max-w-[500px] rounded-2xl border border-[#202f40] bg-[#172337]/80 p-10 shadow-lg'>
          <div className='flex justify-center'>
            <label
              htmlFor='file-upload'
              className='flex cursor-pointer items-center gap-2 rounded-xl bg-[#4cce97] px-8 py-4 font-semibold text-[#111d28] shadow transition hover:bg-[#3c9e75]'
              style={{ minWidth: 200, maxWidth: 300 }}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 12l-4-4m0 0l-4 4m4-4v12'
                />
              </svg>
              <span className='text-base font-semibold'>Upload File</span>
              <input id='file-upload' type='file' className='hidden' />
            </label>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Navbar() {
  return (
    <nav className='flex w-full items-center justify-between border-b border-[#202f40] bg-[#172337] px-4 py-3 shadow-lg'>
      <div className='flex items-center gap-2'>
        <span className='text-lg font-bold tracking-wide text-[#4cce97]'>DocuLock</span>
      </div>
      <div className='flex gap-6'></div>
      <div>
        <button className='rounded-lg bg-[#4cce97] px-4 py-2 font-semibold text-[#111d28] transition hover:bg-[#3c9e75]'>
          Logout
        </button>
      </div>
    </nav>
  );
}
