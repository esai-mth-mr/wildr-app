import React from 'react';
import Image from 'next/image';
import { waysToEarn, wildrcoinTranslations } from '../../data';
import { StyledWay, StyledWaysBlockContent, StyledWaysWrapper } from './styles';
import { StyledHeading2, StyledParagraph2 } from '@/app/globalStyles';

export const WaysToEarn: React.FC = () => {
  return (
    <StyledWaysBlockContent>
      <StyledHeading2>
        {wildrcoinTranslations.page_wildrcoin_ways_title}
      </StyledHeading2>
      <StyledWaysWrapper>
        {waysToEarn.map(item => (
          <StyledWay bg={item.bg.src} key={item.title}>
            <div>
              <Image src={item.icon} alt={item.title} />
              <StyledHeading2>{item.title}</StyledHeading2>
              <StyledParagraph2>{item.description}</StyledParagraph2>
            </div>
            <Image src={item.img} alt={item.title} />
          </StyledWay>
        ))}
      </StyledWaysWrapper>
    </StyledWaysBlockContent>
  );
};
