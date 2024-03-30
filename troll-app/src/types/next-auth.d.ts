import 'next-auth';

declare module 'next-auth/jwt' {
  interface JWT {
    twitterAccessToken: string;
    twitterAccountId: string;
  }
}

declare module 'next-auth' {
  interface Session {
    twitterAccountId: string;
  }
}
