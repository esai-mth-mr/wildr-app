import styled from 'styled-components';
import { heading1Styles } from '@/app/globalStyles';
import { StyledHomeElementWrapper } from '@/app/styles';
import { tablet } from '@/mediaQueries';

export const Container = styled(StyledHomeElementWrapper)`
  display: flex;
  flex-direction: column;
  align-items: center;

  h1 {
    ${heading1Styles}
    margin-bottom: ${({ theme }) => theme.spaces.space7};

    span {
      font-size: inherit;
      line-height: inherit;
      color: ${({ theme }) => theme.colors.brandGreen};
    }
  }
`;

export const EdgeContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  grid-column-gap: ${({ theme }) => theme.spaces.space3};
  grid-row-gap: ${({ theme }) => theme.spaces.space3};

  @media ${tablet} {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const StyledEdge = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => `${theme.spaces.space5} ${theme.spaces.space3}`};
  background-color: ${({ theme }) => theme.colors.secondarySection};
  border-radius: 1rem;
  text-align: center;

  img {
    width: 10rem;
    height: 10rem;
    margin-bottom: ${({ theme }) => theme.spaces.space3};

    @media ${tablet} {
      width: 7rem;
      height: 7rem;
    }
  }

  h3 {
    margin-bottom: ${({ theme }) => theme.spaces.space1};
    color: ${({ theme }) => theme.colors.primaryText};
  }
`;
