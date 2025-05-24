import { FaLock } from 'react-icons/fa';
//
export const Header = () => {
  return (
    <div className='relative mb-6 flex flex-col items-center justify-center'>
      <FaLock className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-7xl text-white opacity-10' />
      <h1 className='relative z-10 text-center text-3xl font-bold text-white opacity-90'>
        DocuLock
      </h1>
    </div>
  );
};
