import { desktop, tablet } from '@/mediaQueries';
import styled from 'styled-components';

export const Container = styled.div<{ bgColor: string }>`
  position: relative;
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => `${theme.spaces.space9} ${theme.spaces.space6}`};
  width: 100%;
  background-color: ${({ bgColor }) => bgColor};
  z-index: 2;

  @media ${desktop} {
    flex-direction: row;
    justify-content: center;
  }

  * {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  grid-row-gap: ${({ theme }) => theme.spaces.space4};
  max-width: 800px;

  @media ${tablet} {
    max-width: 672px;
  }

  & > div {
    display: flex;
    align-items: center;

    img {
      width: 6.25rem;
      height: 6.25rem;
      border-radius: 50%;
      margin-right: ${({ theme }) => theme.spaces.space3};
    }
  }
`;

export const StyledQuoteIcon = styled.div`
  position: absolute;
  z-index: -1;
  top: ${({ theme }) => theme.spaces.space9};
  right: ${({ theme }) => theme.spaces.space6};

  @media ${desktop} {
    position: relative;
    margin-left: ${({ theme }) => theme.spaces.space14};
  }

  svg {
    width: 120px;
    min-width: 100px;
    height: fit-content;
    object-fit: contain;
  }
`;
