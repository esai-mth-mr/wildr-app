import { StyledParagraph1 } from '@/app/globalStyles';
import { desktop, tablet } from '@/mediaQueries';
import styled from 'styled-components';

export const MainContainer = styled.div`
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  grid-column-gap: ${({ theme }) => theme.spaces.space12};
  max-width: 1200px;
  padding: ${({ theme }) => `${theme.spaces.space8} 0 ${theme.spaces.space10}`};
  margin: 0 ${({ theme }) => theme.spaces.space4};

  & > img {
    width: 19.75rem;
    height: fit-content;
    margin-bottom: ${({ theme }) => theme.spaces.space8};

    @media ${desktop} {
      margin-bottom: 0;
    }
  }

  @media ${desktop} {
    flex-direction: row;
  }
`;

export const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  width: fit-content;
  text-align: center;

  @media ${tablet} {
    text-align: left;
  }

  h1 {
    margin-bottom: ${({ theme }) => theme.spaces.space2};
    text-align: inherit;
  }

  p {
    margin-bottom: ${({ theme }) => theme.spaces.space3};
  }
`;

export const StyledGreenParagraph = styled(StyledParagraph1)`
  color: ${({ theme }) => theme.colors.brandGreen};
  margin-bottom: ${({ theme }) => theme.spaces.space4};
`;

export const DownloadWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  @media ${tablet} {
    align-items: start;
  }

  p {
    margin-bottom: ${({ theme }) => theme.spaces.space3};
  }
`;

export const Links = styled.div`
  display: flex;
  flex-direction: column;
  grid-row-gap: ${({ theme }) => theme.spaces.space1};

  @media ${tablet} {
    grid-column-gap: ${({ theme }) => theme.spaces.space3};
    grid-row-gap: unset;
    flex-direction: row;
  }

  a {
    width: 168px;
    height: 50px;

    @media ${tablet} {
      width: 10.5rem;
      height: 3.125rem;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
`;
