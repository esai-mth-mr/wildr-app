'use client';

import { StyledHomeContainer } from './styles';
import { AuthenticNetwork, MainScreen, Quote } from '@/components/home';
import { WhyWildr, Frames, WildrEdge } from '@/components/home';
import { quotes } from './homeData';
import { useTheme } from 'styled-components';
import { useRedirectToWildrcoin } from '@/hooks';

const Home: React.FC = () => {
  const theme = useTheme();

  useRedirectToWildrcoin();

  return (
    <StyledHomeContainer>
      <MainScreen />
      <Frames />
      <WhyWildr />
      <WildrEdge />
      <Quote
        data={quotes[0]}
        colors={[theme.colors.brandGreen900, theme.colors.brandGreen]}
      />
      <AuthenticNetwork />
      <Quote
        data={quotes[1]}
        colors={[theme.colors.sherpaBlue, theme.colors.sherpaBlue1000]}
      />
    </StyledHomeContainer>
  );
};

export default Home;
