'use client';

import React from 'react';
import { StyledWildrcoinContainer } from './styles';
import { WildrcoinMain, WaysToEarn } from './components';
import { JoinForm } from './components/JoinForm';

const Wildrcoin = () => {
  return (
    <StyledWildrcoinContainer>
      <WildrcoinMain />
      <WaysToEarn />
      <JoinForm />
    </StyledWildrcoinContainer>
  );
};

export default Wildrcoin;
