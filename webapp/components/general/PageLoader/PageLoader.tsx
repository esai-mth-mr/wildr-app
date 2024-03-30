import React from 'react';
import { StyledPageLoader } from './styles';
import { Spinner } from '..';

export const PageLoader: React.FC = () => {
  return (
    <StyledPageLoader>
      <Spinner width="6rem" height="6rem" size="0.5rem" />
      <p>Loading...</p>
    </StyledPageLoader>
  );
};
