'use client';

import { DefaultTheme } from 'styled-components';
import { useMediaQuery } from '..';
import { mobile, mobileLandscapeClient, tabletClient } from '@/mediaQueries';

const useThemeSpacing = () => {
  const isMobile = useMediaQuery(mobile);
  const isMobileLandscape = useMediaQuery(mobileLandscapeClient);
  const isTablet = useMediaQuery(tabletClient);

  const baseUnit = isMobile
    ? 1
    : isMobileLandscape
      ? 0.6
      : isTablet
        ? 0.5
        : 0.5;

  return {
    space1: `${baseUnit}rem`,
    space2: `${baseUnit * 2}rem`,
    space3: `${baseUnit * 3}rem`,
    space4: `${baseUnit * 4}rem`,
    space5: `${baseUnit * 5}rem`,
    space6: `${baseUnit * 6}rem`,
    space7: `${baseUnit * 7}rem`,
    space8: `${baseUnit * 8}rem`,
    space9: `${baseUnit * 9}rem`,
    space10: `${baseUnit * 10}rem`,
    space11: `${baseUnit * 11}rem`,
    space12: `${baseUnit * 12}rem`,
    space13: `${baseUnit * 13}rem`,
    space14: `${baseUnit * 14}rem`,
    space15: `${baseUnit * 15}rem`,
    space16: `${baseUnit * 16}rem`,
    space17: `${baseUnit * 17}rem`,
    space18: `${baseUnit * 18}rem`,
    space19: `${baseUnit * 19}rem`,
    space20: `${baseUnit * 20}rem`,
    space21: `${baseUnit * 21}rem`,
    space22: `${baseUnit * 22}rem`,
    space23: `${baseUnit * 23}rem`,
    space24: `${baseUnit * 24}rem`,
    space25: `${baseUnit * 25}rem`,
  };
};

export const useTheme = () => {
  const shared = {
    brandGreen: '#00A84E',
    errorRed: '#FFDEDE',
    brandGreen900: '#009746',
    sherpaBlue: '#0A8BAE',
    sherpaBlue1000: '#0DAED9',
  };

  const spaces = useThemeSpacing();

  const theme: DefaultTheme = {
    colors: {
      primary: '#FFFFFF',
      primaryLayer: '#EDEDF0',
      primarySection: '#FFFFFF',
      primaryText: '#1A1A1E',
      secondaryLayer: '#DCDDE4',
      secondarySection: '#F4F4F4',
      secondaryText: '#86878C',
      tirtiaryText: '#A2A3A9',
      ...shared,
    },
    spaces,
  };

  return theme;
};
