import { signOut } from 'next-auth/react';

export default function Footer() {
  return (
    <footer className='p-8 pt-24'>
      <button
        className='uppercase text-wildr-gray-500 decoration-2 underline-offset-2 hover:underline'
        onClick={() => signOut()}
      >
        Log out
      </button>
    </footer>
  );
}
