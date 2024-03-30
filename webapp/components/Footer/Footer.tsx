import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'styled-components';
import { useSearchParams } from 'next/navigation';
import {
  StyledBottomContent,
  StyledFooter,
  StyledLinks,
  StyledSocials,
  StyledTextContainer,
  StyledTopContent,
} from './styles';
import { WildrLogo, instagram, linkedin, twitter } from '@/assets/images';
import { StyledParagraph3, StyledParagraph4 } from '@/app/globalStyles';

export const Footer: React.FC = () => {
  const searchParams = useSearchParams();
  const isIframe = searchParams.get('iframe');
  const theme = useTheme();

  if (isIframe) return null;

  return (
    <StyledFooter>
      <StyledTopContent>
        <WildrLogo color={theme.colors.primary} />
        <StyledLinks>
          <Link href="/legal/privacy-policy">
            <StyledParagraph4>Privacy</StyledParagraph4>
          </Link>
          <Link href="/legal/terms-of-service">
            <StyledParagraph4>Terms</StyledParagraph4>
          </Link>
          <Link href="/legal/community-guidelines">
            <StyledParagraph4>Community Guidelines</StyledParagraph4>
          </Link>
          <Link href="/contact">
            <StyledParagraph4>Contact</StyledParagraph4>
          </Link>
        </StyledLinks>
      </StyledTopContent>
      <StyledBottomContent>
        <StyledTextContainer>
          <StyledParagraph3>
            Parental Consent is required for children under 13 trying to access
            Wildr&apos;s services. Please refer to Wildr&apos;s{' '}
            <Link href="/legal/privacy-policy">Privacy Policy</Link>.
          </StyledParagraph3>
          <StyledParagraph3>
            © Copyright Wildr 2023. All Rights Reserved.
          </StyledParagraph3>
        </StyledTextContainer>
        <StyledSocials>
          <Link href="https://twitter.com/wildrsocial" target="_blank">
            <Image src={twitter} alt="twitter" />
          </Link>
          <Link
            href="https://www.linkedin.com/company/wildr-inc/?trk=public_profile_experience-item_profile-section-card_subtitle-click&originalSubdomain=in"
            target="_blank"
          >
            <Image src={linkedin} alt="linkedin" />
          </Link>
          <Link href="https://www.instagram.com/wildrsocial/" target="_blank">
            <Image src={instagram} alt="instagram" />
          </Link>
        </StyledSocials>
      </StyledBottomContent>
    </StyledFooter>
  );
};
