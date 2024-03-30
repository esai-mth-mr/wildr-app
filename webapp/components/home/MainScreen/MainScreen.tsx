import { appstore, hero, playstore } from '@/assets/images';
import Image from 'next/image';
import React from 'react';
import {
  MainContainer,
  DownloadWrapper,
  Links,
  MainContent,
  StyledGreenParagraph,
} from './styles';
import Link from 'next/link';
import { translations } from '@/app/homeData';
import { StyledHeading1, StyledParagraph1 } from '@/app/globalStyles';

export const MainScreen: React.FC = () => {
  return (
    <MainContainer>
      <MainContent>
        <StyledHeading1>{translations.page_home_main_title}</StyledHeading1>
        <StyledParagraph1>
          {translations.page_home_main_description}
        </StyledParagraph1>
        <StyledGreenParagraph>
          {translations.page_home_main_p_green}
        </StyledGreenParagraph>
        <DownloadWrapper>
          <StyledParagraph1>
            {translations.page_home_main_download}
          </StyledParagraph1>
          <Links>
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
          </Links>
        </DownloadWrapper>
      </MainContent>
      <Image src={hero} alt="hero" />
    </MainContainer>
  );
};
