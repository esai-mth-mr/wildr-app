import NextAuth, { NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/',
  },
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: '2.0',
    }),
  ],
  // We use callbacks here to expose the Twitter access token and account ID to
  // the JWT token.
  callbacks: {
    async jwt({ token, account }) {
      // JWT will be called/accessed multiple times, so make sure to set it only
      // when the account is available. Otherwise, it will be overwritten with
      // undefined.
      if (account && account.access_token) {
        token.twitterAccountId = account.providerAccountId;
        token.twitterAccessToken = account.access_token;
      }

      return token;
    },
    async session({ session, token }) {
      session.twitterAccountId = token.twitterAccountId;

      return session;
    },
  },
};

export default NextAuth(authOptions);
