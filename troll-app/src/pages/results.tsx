import { analytics } from '@/analytics';
import InfoButton from '@/components/InfoButton';
import InfoDialog from '@/components/InfoDialog';
import Layout from '@/components/Layout';
import Loading from '@/components/Loading';
import QrCode from '@/components/QrCode';
import ResultsCard from '@/components/ResultsCard';
import {
  DOWNLOAD_LINK_APPLE,
  DOWNLOAD_LINK_GOOGLE,
  SOCIAL_INSTAGRAM_URL,
  SOCIAL_TIKTOK_URL,
  SOCIAL_TWITTER_URL,
} from '@/constants';
import { ToxicityResults } from '@/types/tweet';
import { logEvent, setUserId } from 'firebase/analytics';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Marquee from 'react-fast-marquee';
import { SiInstagram, SiTiktok, SiTwitter } from 'react-icons/si';
import useSWR from 'swr';
import { authOptions } from './api/auth/[...nextauth]';

const fetcher = (): Promise<ToxicityResults> =>
  fetch('/api/twitter/timeline').then((res) => res.json());

const loadingMessages = [
  'GOING THROUGH YOUR FEED...',
  'IDENTIFYING TOXIC TWEETS....',
  'PERFORMING TOXICITY ANALYSIS...',
  'CALCULATING YOUR FINAL SCORE...',
  'ASSIGNING YOUR TOXICITY MBTI...',
];

export default function Results() {
  const { data: session, status: sessionStatus } = useSession({
    required: true,
  });

  // Log the user in Firebase Analytics.
  useEffect(() => {
    if (session) {
      setUserId(analytics, session.twitterAccountId);

      logEvent(analytics, 'TwitterLoginSuccess');
    }
  }, [session]);

  const { data, error, isLoading, mutate, isValidating } = useSWR(
    '/api/twitter/timeline',
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const hasError = error || data?.error;

  const [openInfoDialog, setOpenDialog] = useState(false);
  // const [openShareDialog, setOpenShareDialog] = useState(false);

  const isPageloading =
    isLoading || isValidating || sessionStatus === 'loading';

  // Prevent hydration mismatch by only setting the loading message on the client.
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  // Cycle through loading messages every 3 seconds.
  useEffect(() => {
    let loadingMessageIndex = 1;
    let interval: NodeJS.Timer;
    if (isPageloading) {
      interval = setInterval(
        () =>
          setLoadingMessage(
            loadingMessages[loadingMessageIndex++ % loadingMessages.length]
          ),
        3000
      );
    }

    return () => clearInterval(interval);
  }, [isPageloading]);

  if (isPageloading || !data || hasError) {
    if (typeof window !== 'undefined') {
      if (data?.error === 'Unauthorized') {
        logEvent(analytics, 'TwitterLoginFailure', {
          reason: data.error,
        });

        signOut();
        return;
      } else if (hasError) {
        logEvent(analytics, 'GetDetoxScoreFailure', {
          reason: data?.error || error,
        });
      }
    }

    return (
      <Loading message={loadingMessage} error={hasError} onRetry={mutate} />
    );
  }

  return (
    <Layout
      title='Your Toxicity MBTI | Wildr'
      description='Your toxicity MBTI.'
      showInfoButton
    >
      <InfoDialog open={openInfoDialog} onClose={() => setOpenDialog(false)} />

      {/* <WildrDialog
        title='Share your results'
        open={openShareDialog}
        onClose={() => setOpenShareDialog(false)}
      >
        <div className='flex flex-col items-center gap-4'>
          <Button>Copy link</Button>

          <Button>Download image</Button>
        </div>
      </WildrDialog> */}

      <section className='w-full'>
        <ResultsCard
          name={session?.user?.name?.split(' ')[0] || 'Okay'}
          results={data}
          showTopToxicUsers={data.most_toxic_following!.length > 0}
          topRight={
            <div className='hidden p-6 lg:block'>
              <InfoButton onClick={() => setOpenDialog(true)} />
            </div>
          }
          // bottom={
          //   <Button
          //     className='lg:share-button hover:scale-105 lg:-mb-8 lg:text-white lg:backdrop-blur-xl'
          //     onClick={() => setOpenShareDialog(true)}
          //   >
          //     Share your results
          //   </Button>
          // }
        />
      </section>

      <section className='mt-10 flex w-full flex-col items-center gap-4 bg-wildr-gray-1000 px-8 py-12 text-center lg:mt-28 lg:gap-8 lg:py-28'>
        <h2 className='semibold text-xl font-semibold uppercase lg:text-3xl'>
          How did we determine your Toxicity MBTI?
        </h2>

        <p className='max-w-lg font-body text-xs sm:text-sm lg:max-w-3xl lg:text-2xl'>
          We took a random sample of tweets made by each of the people you
          follow from the past 7 days and put them through Wildr&apos;s powerful
          toxicity detection AI model to calculate the levels of toxicity in
          each of the four main categories. Results may change daily based on
          new tweets.
        </p>
      </section>

      <Marquee
        className='h-10 bg-wildr-emerald-500 lg:h-16'
        direction='right'
        gradient={false}
      >
        {Array.from(Array(22).keys()).map((i) => (
          <div
            key={i}
            className='ml-2 flex items-center gap-2 lg:ml-4 lg:gap-4'
          >
            <p className='text-sm font-semibold uppercase lg:text-2xl'>
              Entering the toxicity free zone
            </p>

            <div className='relative aspect-[3/1] h-6 lg:h-10'>
              <Image
                src='/icons/triangles.webp'
                alt='Triangle decoration.'
                fill
              />
            </div>
          </div>
        ))}
      </Marquee>

      <section className="flex w-full flex-col gap-6 bg-[url('/images/mesh-gradient.webp')] bg-cover px-4 py-14 text-center lg:gap-16 lg:px-8 lg:pt-48">
        <div className='flex flex-col items-center gap-6 lg:flex-row lg:justify-evenly'>
          <div className='flex max-w-3xl flex-col gap-6 lg:gap-12 lg:text-left'>
            <div className='flex flex-col items-center gap-4 lg:items-start lg:gap-8'>
              <h2 className='text-2xl font-semibold uppercase lg:text-7xl'>
                No toxicity social media
              </h2>

              <p className='max-w-lg font-body text-xs sm:text-base lg:max-w-none lg:text-2xl'>
                Start your social media detox without giving up your social
                life.
              </p>
            </div>

            <div className='z-10 flex h-20 items-center justify-center gap-2 lg:justify-start'>
              <a
                className='relative h-full w-32 lg:w-44'
                href={DOWNLOAD_LINK_APPLE}
                target='_blank'
                rel='noreferrer'
              >
                <Image
                  src='/badges/apple.svg'
                  alt='Official Apple badge with "Download on the App Store".'
                  fill
                />
              </a>

              <a
                className='relative h-full w-36 lg:w-52'
                href={DOWNLOAD_LINK_GOOGLE}
                target='_blank'
                rel='noreferrer'
              >
                <Image
                  src='/badges/google.svg'
                  alt='Official Apple badge with "Download on the App Store".'
                  fill
                />
              </a>

              <div className='hidden h-full lg:block'>
                <QrCode />
              </div>
            </div>
          </div>

          <div className='relative -my-16 h-[700px] w-full lg:h-[900px] lg:w-[500px] lg:min-w-[300px]'>
            <Image
              className='object-contain'
              src='/images/device.webp'
              alt='A screenshot showcasing the home feed for the Wildr mobile app.'
              fill
            />
          </div>
        </div>

        <div className='z-10 flex flex-col items-center gap-4'>
          <p className='font-semibold lg:block lg:text-2xl'>@wildrsocial</p>

          <div className='flex gap-6 lg:gap-8'>
            <a href={SOCIAL_TWITTER_URL} target='_blank' rel='noreferrer'>
              <SiTwitter
                className='text-3xl lg:text-5xl'
                aria-label="Go to Wildr's Twitter"
              />
            </a>

            <a href={SOCIAL_INSTAGRAM_URL} target='_blank' rel='noreferrer'>
              <SiInstagram
                className='text-3xl lg:text-5xl'
                aria-label="Go to Wildr's Instagram"
              />
            </a>

            <a href={SOCIAL_TIKTOK_URL} target='_blank' rel='noreferrer'>
              <SiTiktok
                className='text-3xl lg:text-5xl'
                aria-label="Go to Wildr's TikTok"
              />
            </a>
          </div>
        </div>

        <button
          className='uppercase decoration-2 underline-offset-2 hover:underline'
          onClick={() => signOut()}
        >
          Log out
        </button>
      </section>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  // If no session exists, redirect to the home page.
  if (!session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
