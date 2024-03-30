'use client';

import React from 'react';
import { DefaultLayoutProps } from '@/types';
import { StyleSheetManager, ThemeProvider } from 'styled-components';
import isValidProp from '@emotion/is-prop-valid';
import { ApolloProvider } from '@apollo/client';
import client from '@/boot/apolloClient';
import GlobalStyles from '@/app/globalStyles';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useTheme } from '@/hooks';
import { StyledContainer } from '@/app/styles';

export const MainLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  const theme = useTheme();

  return (
    <ApolloProvider client={client}>
      <StyleSheetManager shouldForwardProp={propName => isValidProp(propName)}>
        <ThemeProvider theme={theme}>
          <GlobalStyles />
          <StyledContainer>
            <Header />
            {children}
            <Footer />
          </StyledContainer>
        </ThemeProvider>
      </StyleSheetManager>
    </ApolloProvider>
  );
};
