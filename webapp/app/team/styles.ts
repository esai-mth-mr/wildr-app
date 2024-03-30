import { desktop, mobileLandscape, tablet } from '@/mediaQueries';
import styled from 'styled-components';
import {
  StyledHeading3,
  StyledParagraph1,
  StyledParagraph2,
} from '../globalStyles';

export const StyledTeamContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1000px;
  width: 100%;
  margin: 0 ${({ theme }) => theme.spaces.space4};
  padding: ${({ theme }) => `${theme.spaces.space8} 0`};

  @media ${desktop} {
    margin: 0 auto;
  }

  h2 {
    margin-bottom: ${({ theme }) => theme.spaces.space2};
    text-align: center;
  }

  & > p {
    max-width: 774px;
    text-align: center;
    margin: 0 auto ${({ theme }) => theme.spaces.space6};
  }
`;

export const StyledTeam = styled.ul`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const StyledMember = styled.li`
  display: flex;
  flex-direction: column;
  grid-row-gap: ${({ theme }) => theme.spaces.space4};
  margin-bottom: ${({ theme }) => theme.spaces.space4};
  padding: ${({ theme }) => `${theme.spaces.space6} ${theme.spaces.space5}`};
  background-color: ${({ theme }) => theme.colors.secondarySection};
  border-radius: 1rem;

  @media ${tablet} {
    flex-direction: row;
  }

  @media ${desktop} {
    max-width: calc(100% - ${({ theme }) => theme.spaces.space4}*2);
  }

  img {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    margin-right: ${({ theme }) => theme.spaces.space4};

    @media ${mobileLandscape} {
      width: 120px;
      height: 120px;
    }

    @media ${tablet} {
      width: 144px;
      height: 144px;
    }

    @media ${desktop} {
      width: 150px;
      height: 150px;
    }
  }

  div {
    display: flex;
    flex-direction: column;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

export const StyledName = styled(StyledHeading3)`
  margin-bottom: ${({ theme }) => theme.spaces.space1};
`;

export const StyledTitle = styled(StyledParagraph1)`
  color: ${({ theme }) => theme.colors.brandGreen};
  margin-bottom: ${({ theme }) => theme.spaces.space2};
`;

export const StyledAchievements = styled(StyledParagraph2)`
  margin-bottom: ${({ theme }) => theme.spaces.space1};
`;

export const StyledBio = styled(StyledParagraph2)`
  @media ${tablet} {
    width: 74%;
  }
`;
