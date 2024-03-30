import { authentic_network } from '@/assets/images';
import Image from 'next/image';
import React from 'react';
import { BottomContent, Container } from './styles';
import { translations } from '@/app/homeData';
import { StyledParagraph1, StyledParagraph2 } from '@/app/globalStyles';

export const AuthenticNetwork: React.FC = () => {
  return (
    <Container>
      <div
        dangerouslySetInnerHTML={{
          __html: translations.page_home_authentic_title,
        }}
      />

      <StyledParagraph1>{translations.page_home_authentic_p}</StyledParagraph1>
      <Image src={authentic_network} alt="authentic network" />
      <BottomContent>
        <StyledParagraph2>
          {translations.page_home_authentic_bottom_p}
        </StyledParagraph2>
      </BottomContent>
    </Container>
  );
};
