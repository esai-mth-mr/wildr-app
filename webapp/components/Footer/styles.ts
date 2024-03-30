import { convertHexToRGB } from '@/app/utility';
import { desktop, mobileLandscape, tablet } from '@/mediaQueries';
import styled from 'styled-components';

export const StyledFooter = styled.footer`
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.primaryText};
  padding: ${({ theme }) => `${theme.spaces.space9} ${theme.spaces.space6}`};
`;

export const StyledTopContent = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: ${({ theme }) => theme.spaces.space3};
  margin-bottom: ${({ theme }) => theme.spaces.space3};
  border-bottom: 1px solid
    rgba(${({ theme }) => convertHexToRGB(theme.colors.primary)}, 0.75);

  @media ${tablet} {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

export const StyledLinks = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: ${({ theme }) => theme.spaces.space5};

  a {
    color: ${({ theme }) => theme.colors.primary};
    margin-right: ${({ theme }) => theme.spaces.space3};
    margin-bottom: ${({ theme }) => theme.spaces.space2};

    &:last-child {
      margin-right: 0;
      margin-bottom: 0;
    }
  }

  @media ${mobileLandscape} {
    flex-direction: row;
  }

  @media ${desktop} {
    margin-top: 0;
  }
`;

export const StyledBottomContent = styled.div`
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-start;

  @media ${tablet} {
    flex-direction: row;
    justify-content: space-between;
  }
`;

export const StyledTextContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  color: rgb(255, 255, 255, 0.5);

  @media ${tablet} {
    margin-right: ${({ theme }) => theme.spaces.space4};
  }

  p {
    color: rgba(${({ theme }) => convertHexToRGB(theme.colors.primary)}, 0.75);
    text-align: start;

    @media ${tablet} {
      text-align: start;
    }

    &:first-child {
      margin-bottom: ${({ theme }) => theme.spaces.space4};
    }

    & a {
      text-decoration: underline;
    }
  }
`;

export const StyledSocials = styled.div`
  display: flex;
  justify-content: center;
  grid-column-gap: ${({ theme }) => theme.spaces.space3};
  margin-left: 0;
  margin-bottom: ${({ theme }) => theme.spaces.space3};

  a img {
    width: 20px;
    height: max-content;
    object-fit: contain;

    @media ${tablet} {
      width: 35px;
    }
  }

  @media ${tablet} {
    justify-content: flex-start;
  }

  @media ${desktop} {
    margin-left: ${({ theme }) => theme.spaces.space3};
    margin-top: 0;
  }
`;
