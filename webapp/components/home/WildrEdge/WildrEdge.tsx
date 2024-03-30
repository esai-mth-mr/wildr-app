import Image from 'next/image';
import React from 'react';
import { wildrEdge } from './data';
import { Container, EdgeContainer, StyledEdge } from './styles';
import { translations } from '@/app/homeData';
import { StyledHeading3, StyledParagraph2 } from '@/app/globalStyles';

export const WildrEdge: React.FC = () => {
  return (
    <Container>
      <div
        dangerouslySetInnerHTML={{ __html: translations.page_home_edge_title }}
      />
      <EdgeContainer>
        {wildrEdge.map(edge => (
          <StyledEdge key={edge.title}>
            <Image src={edge.img} alt="edge" />
            <StyledHeading3>{edge.title}</StyledHeading3>
            <StyledParagraph2>{edge.description}</StyledParagraph2>
          </StyledEdge>
        ))}
      </EdgeContainer>
    </Container>
  );
};
