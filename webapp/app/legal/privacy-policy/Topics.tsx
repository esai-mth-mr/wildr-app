import React from 'react';
import { StyledLegalBody, StyledTopic } from '../styles';
import { translations } from './data';
import { StyledHeading3 } from '@/app/globalStyles';

const Topics = () => {
  return (
    <StyledLegalBody>
      {[...new Array(17)].map((_, i) => (
        <StyledTopic key={i} id={`section-${i + 1}`}>
          <StyledHeading3>
            {translations[`page_privacy_point${i + 1}_title`]}
          </StyledHeading3>
          <div
            dangerouslySetInnerHTML={{
              __html: translations[`page_privacy_point${i + 1}_body`],
            }}
          />
        </StyledTopic>
      ))}
    </StyledLegalBody>
  );
};

export default Topics;
