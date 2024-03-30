import React from 'react';
import {
  StyledFormWrapper,
  StyledJoinDescription,
  StyledJoinForm,
  StyledJoinLinks,
  StyledJoinQR,
} from './styles';
import { wildrcoinTranslations } from '../../data';
import { WildrcoinForm } from '../WildrcoinForm';
import { WildrQRCode, appstore, playstore } from '@/assets/images';
import { useMediaQuery } from '@/hooks';
import Link from 'next/link';
import Image from 'next/image';
import { StyledHeading2, StyledParagraph4Bold } from '@/app/globalStyles';

export const JoinForm: React.FC = () => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <StyledJoinForm>
      <StyledFormWrapper>
        <StyledHeading2>
          {wildrcoinTranslations.page_wildrcoin_join_title}
        </StyledHeading2>
        <StyledJoinDescription>
          {wildrcoinTranslations.page_wildrcoin_join_description}
        </StyledJoinDescription>
        <WildrcoinForm />
      </StyledFormWrapper>
      {isDesktop && (
        <StyledJoinQR>
          <WildrQRCode />
          <div>
            <StyledParagraph4Bold>
              {wildrcoinTranslations.page_wildrcoin_join_scan}
            </StyledParagraph4Bold>
          </div>
        </StyledJoinQR>
      )}
      {!isDesktop && (
        <StyledJoinLinks>
          <Link
            href="https://apps.apple.com/my/app/wildr/id1604130204"
            target="_blank"
          >
            <Image src={appstore} alt="appstore" />
          </Link>
          <Link
            href="https://play.google.com/store/apps/details?id=com.wildr.app"
            target="_blank"
          >
            <Image src={playstore} alt="playstore" />
          </Link>
        </StyledJoinLinks>
      )}
    </StyledJoinForm>
  );
};
