'use client';

import React from 'react';
import {
  StyledLegalBody,
  StyledLegalContainer,
  StyledLegalHeader,
  StyledTopic,
} from '../styles';
import { translations } from './data';
import {
  StyledHeading2,
  StyledHeading3,
  StyledParagraph2,
} from '@/app/globalStyles';

const CommunityGuidelines: React.FC = () => {
  return (
    <>
      <StyledLegalContainer>
        <StyledLegalHeader>
          <StyledHeading2>{translations.page_community_title}</StyledHeading2>
          <StyledParagraph2>
            {translations.page_community_update_date}
          </StyledParagraph2>
        </StyledLegalHeader>
        <StyledLegalBody>
          {[...new Array(27)].map((_, i) => (
            <StyledTopic key={i}>
              <StyledHeading3>
                {translations[`page_community_point${i + 1}_title`]}
              </StyledHeading3>
              <div
                dangerouslySetInnerHTML={{
                  __html: translations[`page_community_point${i + 1}_body`],
                }}
              />
            </StyledTopic>
          ))}
        </StyledLegalBody>
      </StyledLegalContainer>
    </>
  );
};

export default CommunityGuidelines;
