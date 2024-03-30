import '@/styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import localFont from 'next/font/local';
import Head from 'next/head';

const slussen = localFont({
  src: [
    {
      path: '../../public/fonts/Slussen-Extended-Regular.woff2',
      weight: '400',
    },
    {
      path: '../../public/fonts/Slussen-Expanded-Semibold.woff2',
      weight: '600',
    },
  ],
  variable: '--font-slussen',
});

const satoshi = localFont({
  src: '../../public/fonts/Satoshi-Medium.woff2',
  variable: '--font-satoshi',
});

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <>
      <Head>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
      </Head>

      <div className={`${slussen.variable} ${satoshi.variable} font-sans`}>
        <SessionProvider session={session}>
          <Component {...pageProps} />
        </SessionProvider>
      </div>
    </>
  );
}
