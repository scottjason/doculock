import * as React from 'react';

export const Footer = (): React.JSX.Element => {
  return (
    <footer className='mt-6 text-xs text-gray-500'>© {new Date().getFullYear()} DocuLock</footer>
  );
};
