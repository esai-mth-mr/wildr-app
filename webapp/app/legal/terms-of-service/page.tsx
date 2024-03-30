'use client';

import React from 'react';
import { StyledLegalContainer, StyledLegalHeader } from '../styles';
import { translations } from './data';
import MainTerms from './MainTerms';
import { StyledHeading2, StyledParagraph2 } from '@/app/globalStyles';

const TermsOfService: React.FC = () => {
  return (
    <StyledLegalContainer>
      <StyledLegalHeader>
        <StyledHeading2>{translations.page_terms_title}</StyledHeading2>
        <StyledParagraph2>
          {translations.page_terms_update_date}
        </StyledParagraph2>
      </StyledLegalHeader>
      <MainTerms />
    </StyledLegalContainer>
  );
};

export default TermsOfService;
