import React from 'react';
import { StyledLegalBody, StyledTopic } from '../styles';
import { translations } from './data';
import { StyledTermsIntro } from './styles';
import { StyledHeading3 } from '@/app/globalStyles';

const MainTerms = () => {
  return (
    <StyledLegalBody>
      <StyledTermsIntro
        dangerouslySetInnerHTML={{
          __html: translations.page_terms_paragraph,
        }}
      />
      {[...new Array(22)].map((_, i) => (
        <StyledTopic id={`section${i + 1}`} key={i}>
          <StyledHeading3>
            {translations[`page_terms_point${i + 1}_title`]}
          </StyledHeading3>
          <div
            dangerouslySetInnerHTML={{
              __html: translations[`page_terms_point${i + 1}_body`],
            }}
          />
        </StyledTopic>
      ))}
    </StyledLegalBody>
  );
};

export default MainTerms;
