import { mobileLandscape, tablet } from '@/mediaQueries';
import styled from 'styled-components';

export const StyledWaysBlockContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => `${theme.spaces.space6} 0 ${theme.spaces.space3}`};
  margin: ${({ theme }) => `0 ${theme.spaces.space3}`};
  z-index: 1;

  @media ${tablet} {
    padding: ${({ theme }) =>
      `${theme.spaces.space11} ${theme.spaces.space12} ${theme.spaces.space16}`};
  }

  h2 {
    text-align: center;
    margin-bottom: ${({ theme }) => theme.spaces.space4};
    max-width: 250px;

    @media ${mobileLandscape} {
      max-width: 330px;
    }

    @media ${tablet} {
      max-width: 518px;
    }
  }
`;

export const StyledWaysWrapper = styled.div`
  display: flex;
  flex-direction: column;
  grid-row-gap: ${({ theme }) => theme.spaces.space4};
  max-width: 1080px;
`;

export const StyledWay = styled.div<{ bg: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.spaces.space6} 0;
  border-radius: 0.75rem;
  height: 300px;
  max-width: 300px;
  overflow: hidden;
  background: center/cover no-repeat url(${({ bg }) => bg});

  @media ${mobileLandscape} {
    max-width: 370px;
    height: 370px;
  }

  @media ${tablet} {
    flex-direction: row;
    grid-column-gap: ${({ theme }) => theme.spaces.space10};
    height: 520px;
    width: 100%;
    max-width: unset;
    padding: 0 ${({ theme }) => theme.spaces.space13} 0;

    &:nth-child(even) {
      flex-direction: row-reverse;
    }
  }

  & > div {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    grid-row-gap: ${({ theme }) => theme.spaces.space2};
    margin-bottom: ${({ theme }) => theme.spaces.space2};
    padding-top: ${({ theme }) => theme.spaces.space2};

    @media ${tablet} {
      padding-top: 0;
      margin-bottom: 0;
    }

    img {
      width: 4.75rem;
      height: 4.75rem;
    }

    h2 {
      text-align: inherit;
      margin: 0;
    }

    p {
      text-align: inherit;
    }
  }

  img {
    width: 100%;
    height: max-content;

    @media ${tablet} {
      width: 390px;
    }
  }
`;
