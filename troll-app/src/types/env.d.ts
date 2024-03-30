declare namespace NodeJS {
  interface ProcessEnv {
    TWITTER_CLIENT_ID: string;
    TWITTER_CLIENT_SECRET: string;

    TROLL_SERVER_URL: string;

    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL: string;

    NEXT_PUBLIC_ENABLE_TOP_TOXIC_USERS: 'true' | 'false';
  }
}
