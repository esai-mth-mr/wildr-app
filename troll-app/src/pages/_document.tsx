import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang='en'>
      <Head>
        <link rel='icon' type='image/svg+xml' href='/images/favicon.svg' />
        <link rel='icon' type='image/png' href='/images/favicon.png' />

        <meta property='og:url' content={process.env.NEXTAUTH_URL} />
        <meta property='og:type' content='website' />
        <meta property='og:title' content='Find out your Toxicity MBTI 👀' />
        <meta
          property='og:description'
          content='Link your Twitter account to have our AI analyze your feed.'
        />
        <meta
          property='og:image'
          content={`${process.env.NEXTAUTH_URL}/images/ogimage.png`}
        />

        <meta name='twitter:card' content='summary_large_image' />
        <meta
          property='twitter:domain'
          content={process.env.NEXTAUTH_URL?.replace('https://', '')}
        />
        <meta property='twitter:url' content={process.env.NEXTAUTH_URL} />
        <meta name='twitter:title' content='Find out your Toxicity MBTI 👀' />
        <meta
          name='twitter:description'
          content='Link your Twitter account to have our AI analyze your feed.'
        />
        <meta
          name='twitter:image'
          content={`${process.env.NEXTAUTH_URL}/images/ogimage.png`}
        />
      </Head>

      <body className='bg-black text-white'>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
