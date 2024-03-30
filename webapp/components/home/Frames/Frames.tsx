import React from 'react';
import {
  StyledFrame,
  StyledFrameContainer,
  StyledImageWrapper,
} from './styles';
import Image from 'next/image';
import { frames } from './data';
import {
  StyledHeading2,
  StyledParagraph2,
  StyledParagraph4Bold,
} from '@/app/globalStyles';
import Link from 'next/link';

export const Frames: React.FC = () => {
  return (
    <StyledFrameContainer>
      {frames.map(frame => (
        <StyledFrame key={frame.title}>
          <StyledImageWrapper>
            <Image src={frame.img} alt="frame_img" />
            <Image src={frame.icon} alt="icon" />
          </StyledImageWrapper>
          <div>
            <StyledHeading2>{frame.title}</StyledHeading2>
            <StyledParagraph2>{frame.description}</StyledParagraph2>
            {frame.wildrcoinCta && (
              <button>
                <Link href="/">
                  <StyledParagraph4Bold>
                    {frame.wildrcoinCtaText}
                  </StyledParagraph4Bold>
                </Link>
              </button>
            )}
          </div>
        </StyledFrame>
      ))}
    </StyledFrameContainer>
  );
};
