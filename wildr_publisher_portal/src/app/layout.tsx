'use client';
import Container from '@/app/components/Container/Container';
import './global.css';
import { AuthContextProvider } from '@/app/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import StyledComponentsRegistry from '@/app/registry';
import {
  ApolloClient,
  ApolloProvider,
  createHttpLink,
  InMemoryCache,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getCookie } from 'cookies-next';
import { JWT_TOKEN } from '@/app/utils/constants';
import { client } from '@/app/apollo/apolloClient';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ApolloProvider client={client}>
          <AuthContextProvider>
            <StyledComponentsRegistry>
              <Container>{children}</Container>
            </StyledComponentsRegistry>
          </AuthContextProvider>
        </ApolloProvider>
        <Toaster />
      </body>
    </html>
  );
}
