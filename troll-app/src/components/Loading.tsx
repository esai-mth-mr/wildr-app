import { signOut } from 'next-auth/react';
import Image from 'next/image';
import Button from './Button';
import Layout from './Layout';

type LoadingIndicatorProps = {
  message?: string;
  error?: boolean;
  onRetry?: () => void;
};

export default function LoadingIndicator({
  message,
  error,
  onRetry,
}: LoadingIndicatorProps) {
  return (
    <Layout
      title='Loading... | Wildr'
      description='Loading your toxicity MBTI...'
    >
      <div className='m-auto flex w-full max-w-screen-lg flex-grow flex-col items-center justify-center gap-8 p-8'>
        <h1 className='text-center text-2xl font-semibold uppercase md:text-4xl'>
          {error ? 'Something went wrong! Please try again' : message}
        </h1>

        {error ? (
          <Button onClick={onRetry}>Retry</Button>
        ) : (
          <div className='relative h-24 w-24 animate-spin'>
            <Image
              src='/icons/spinner.svg'
              alt='A spinning circular icon.'
              fill
              priority
            />
          </div>
        )}

        {error && (
          <button
            className='text-sm uppercase text-wildr-gray-500 decoration-2 underline-offset-2 hover:underline lg:text-base'
            onClick={() => signOut()}
          >
            Log out
          </button>
        )}
      </div>
    </Layout>
  );
}
