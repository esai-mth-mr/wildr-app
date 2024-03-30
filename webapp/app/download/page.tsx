'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'styled-components';
import { StyledDownloadContainer, StyledQRContainer } from './styles';
import {
  StyledHeading1,
  StyledParagraph1,
  StyledParagraph2,
} from '../globalStyles';
import {
  DownloadWrapper,
  Links,
  MainContent,
  StyledGreenParagraph,
} from '@/components/home/MainScreen/styles';
import { translations } from '@/app/homeData';
import { appstore, playstore, WildrQRCode } from '@/assets/images';

const Download = () => {
  const theme = useTheme();

  return (
    <StyledDownloadContainer>
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
      <StyledQRContainer>
        <WildrQRCode color={theme.colors.primary} />
        <StyledParagraph2>Scan to get Wildr</StyledParagraph2>
      </StyledQRContainer>
    </StyledDownloadContainer>
  );
};

export default Download;
