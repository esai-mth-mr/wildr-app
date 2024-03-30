/** @type {import('next').NextConfig} */
import dotenv from 'dotenv';

const environment = process.env.ENVIRONMENT || 'wildr-dev';
const envFile =
  environment === 'wildr-prod'
    ? '.env.production.wildr-prod'
    : '.env.production.wildr-dev';
dotenv.config({ path: envFile });

const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  env: {
    GRAPHQL_URL: process.env.GRAPHQL_URL,
    RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,
  },
  images: {
    unoptimized: true,
  },
  output: 'export',
};

export default nextConfig;
