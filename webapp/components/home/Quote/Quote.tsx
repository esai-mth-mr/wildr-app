import { QuoteType } from '@/app/homeData';
import Image from 'next/image';
import React from 'react';
import { Container, StyledQuoteIcon, TextContainer } from './styles';
import { StyledParagraph1, StyledParagraph2 } from '@/app/globalStyles';
import { QuoteMark } from '@/assets/images';

type Props = {
  colors: [string, string];
  data: QuoteType;
};

export const Quote: React.FC<Props> = ({ colors, data }) => {
  const { text, author, img, position } = data;
  return (
    <Container bgColor={colors[0]}>
      <TextContainer>
        <StyledParagraph1>{text}</StyledParagraph1>
        <div>
          <Image src={img} alt={author} />
          <div>
            <StyledParagraph2>{author}</StyledParagraph2>
            <StyledParagraph2>{position}</StyledParagraph2>
          </div>
        </div>
      </TextContainer>
      <StyledQuoteIcon>
        <QuoteMark color={colors[1]} />
      </StyledQuoteIcon>
    </Container>
  );
};
