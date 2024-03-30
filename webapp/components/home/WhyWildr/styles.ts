import { StyledHomeElementWrapper } from '@/app/styles';
import { desktop } from '@/mediaQueries';
import styled from 'styled-components';

export const StyledContainer = styled(StyledHomeElementWrapper)`
  display: flex;
  grid-column-gap: ${({ theme }) => theme.spaces.space13};
  max-width: 960px;

  & > img {
    display: none;
    width: 18.75rem;
    height: 18.75rem;
    border-radius: 50%;

    @media ${desktop} {
      display: block;
    }
  }

  & > div {
    display: flex;
    flex-direction: column;

    h2 {
      margin-bottom: ${({ theme }) => theme.spaces.space4};
      text-align: left;
    }

    p {
      margin-bottom: ${({ theme }) => theme.spaces.space3};
    }
  }
`;

export const BottomContent = styled.div`
  display: flex;
  align-items: center;

  img {
    display: block;
    border-radius: 50%;
    margin-right: ${({ theme }) => theme.spaces.space2};
    width: 3.75rem;
    height: 3.75rem;

    @media ${desktop} {
      display: none;
    }
  }
`;
