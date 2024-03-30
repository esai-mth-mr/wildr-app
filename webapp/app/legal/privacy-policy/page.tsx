'use client';

import React from 'react';
import { StyledLegalContainer, StyledLegalHeader } from '../styles';
import { translations } from './data';
import Topics from './Topics';
import { StyledHeading2, StyledParagraph2 } from '@/app/globalStyles';

const PrivacyPolicy: React.FC = () => {
  return (
    <StyledLegalContainer>
      <StyledLegalHeader>
        <StyledHeading2>{translations.page_privacy_title}</StyledHeading2>
        <StyledParagraph2>
          {translations.page_privacy_update_date}
        </StyledParagraph2>
      </StyledLegalHeader>
      <Topics />
    </StyledLegalContainer>
  );
};

export default PrivacyPolicy;
