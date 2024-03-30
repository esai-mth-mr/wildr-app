import { analytics } from '@/analytics';
import Button from '@/components/Button';
import Layout from '@/components/Layout';
import { TERMS_OF_SERVICE_URL } from '@/constants';
import { logEvent } from 'firebase/analytics';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { SiTwitter } from 'react-icons/si';
import { authOptions } from './api/auth/[...nextauth]';

export default function Home() {
  useEffect(() => {
    logEvent(analytics, 'GetHome');
  }, []);

  const router = useRouter();

  // If the user is redirected to the home page with an error, log it.
  useEffect(() => {
    const error = router.query['error'];

    if (error) {
      logEvent(analytics, 'TwitterLoginFailure', {
        reason: error,
      });
    }
  }, [router]);

  return (
    <Layout
      title='Wildr Toxicity MBTI'
      description='How toxic is your Twitter feed?'
    >
      <div className='relative flex max-w-screen-xl flex-grow flex-col items-center justify-evenly gap-8 p-4 text-center md:justify-center md:gap-16 md:p-8'>
        <div className='flex flex-col items-center gap-8'>
          <div className='relative aspect-square h-24 md:h-36'>
            <Image
              src='/icons/warning.webp'
              alt='A logo of an exclamation mark enclosed in a diamond shape, all green.'
              fill
              priority
            />
          </div>

          <h1 className='text-4xl font-semibold uppercase md:text-6xl md:leading-tight'>
            How <span className='text-wildr-emerald-500'>toxic</span> is your
            Twitter feed?
          </h1>
          <p className='font-body text-base text-wildr-gray-500 md:text-2xl'>
            Link your Twitter account to have our AI analyze your feed.
          </p>
        </div>

        <div className='flex flex-col items-center gap-4'>
          <Button
            className='text-white md:w-[500px]'
            onClick={() => signIn('twitter', { callbackUrl: '/results' })}
          >
            <SiTwitter className='text-2xl' />
            Let&apos;s find out
          </Button>

          <p className='font-body text-xs text-wildr-gray-500 md:text-lg'>
            By continuing, you agree to our{' '}
            <a
              className='underline underline-offset-4'
              href={TERMS_OF_SERVICE_URL}
              target='_blank'
              rel='noreferrer'
            >
              Terms of Service
            </a>
            . Wildr will not store or sell any of your data.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  // If a session exists, redirect to the results page.
  if (session) {
    return {
      redirect: {
        destination: '/results',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
