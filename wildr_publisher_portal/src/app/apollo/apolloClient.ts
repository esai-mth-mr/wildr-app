import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client';
import { authLink } from '@/app/apollo/authLink';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_LOCAL_GRAPHQL,
});
export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    addTypename: false,
  }),
});
