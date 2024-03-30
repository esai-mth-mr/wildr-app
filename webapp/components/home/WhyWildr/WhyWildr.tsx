import React from 'react';
import { BottomContent, StyledContainer } from './styles';
import Image from 'next/image';
import { viditGujrathi } from '@/assets/images';
import { translations } from '@/app/homeData';
import {
  StyledHeading2,
  StyledParagraph1,
  StyledParagraph1Bold,
} from '@/app/globalStyles';

export const WhyWildr = () => {
  return (
    <StyledContainer>
      <Image src={viditGujrathi} alt="vidit chess champ" />
      <div>
        <StyledHeading2>{translations.page_home_why_title}</StyledHeading2>
        <StyledParagraph1>{translations.page_home_why_p}</StyledParagraph1>
        <BottomContent>
          <Image src={viditGujrathi} alt="vidit chess champ" />
          <StyledParagraph1Bold>
            {translations.page_home_why_person}
          </StyledParagraph1Bold>
        </BottomContent>
      </div>
    </StyledContainer>
  );
};
