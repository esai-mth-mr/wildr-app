import React, { useEffect, useRef, useState } from 'react';
import {
  Separator,
  StyledContent,
  StyledHeader,
  StyledLogoLink,
} from './styles';
import { WildrLogo } from '@/assets/images';
import Link from 'next/link';
import { QRCode } from './QRCode';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Hamburger } from './Hamburger';
import { useSearchParams } from 'next/navigation';
import { useTheme } from 'styled-components';
import { StyledParagraph2 } from '@/app/globalStyles';

export const Header: React.FC = () => {
  const searchParams = useSearchParams();
  const isIframe = searchParams.get('iframe');
  const theme = useTheme();

  const headerRef = useRef<HTMLHeadElement>(null);
  const isDesktop = useMediaQuery('(min-width: 992px)');
  const [headerHeight, setHeaderHeight] = useState<number>(0);

  useEffect(() => {
    setHeaderHeight(headerRef.current?.clientHeight || 0);
  }, []);

  if (isIframe) return null;

  return (
    <StyledHeader ref={headerRef}>
      <StyledContent>
        <StyledLogoLink href="/">
          <WildrLogo color={theme.colors.brandGreen} />
        </StyledLogoLink>
        {isDesktop && (
          <>
            <Separator />
            <Link href="/team">
              <StyledParagraph2>Team</StyledParagraph2>
            </Link>
            <Separator />
            <Link href="/contact">
              <StyledParagraph2>Contact</StyledParagraph2>
            </Link>
            <Separator />
            <Link href="/wildrcoin">
              <StyledParagraph2>Waitlist</StyledParagraph2>
            </Link>
          </>
        )}
      </StyledContent>
      {isDesktop && <QRCode />}
      {!isDesktop && <Hamburger headerHeight={headerHeight} />}
    </StyledHeader>
  );
};
