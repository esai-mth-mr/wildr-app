import { desktop, mobileLandscape, tablet } from '@/mediaQueries';
import styled, { createGlobalStyle } from 'styled-components';

export default createGlobalStyle`
    * {
        font-family: var(--font-satoshi);
        box-sizing: border-box;
        padding: 0;
        margin: 0;
        color: ${({ theme }) => theme.colors.primaryText};
        font-size: 6px;
        line-height: 115%;
        outline: none;

        @media ${mobileLandscape} {
            font-size: 10px;
        }

        @media ${tablet} {
            font-size: 14px;
        }

        @media ${desktop} {
            font-size: 16px;
        }
    }

    html,
    body {
        position: relative;
        max-width: 100vw;
        overflow-x: hidden;
    }

    h1, h2, h3 {
        font-family: var(--font-slussen);
    }

    a {
        text-decoration: none;
        cursor: pointer;
    }

    a, span, p {
        font-family: inherit;
        font-size: inherit;
        font-weight: inherit;
        color: inherit;
    }
`;

export const heading1Styles = `
  font-size: 4rem;

  @media ${mobileLandscape} {
    font-size: 3.2rem;
  }

  @media ${tablet} {
    font-size: 3.4rem;
  }

  @media ${desktop} {
    font-size: 4rem;
  }
`;

export const StyledHeading1 = styled.h1`
  ${heading1Styles}
`;

export const StyledHeading2 = styled.h2`
  font-size: 3rem;

  @media ${mobileLandscape} {
    font-size: 2.4rem;
  }

  @media ${tablet} {
    font-size: 2.7rem;
  }

  @media ${desktop} {
    font-size: 3rem;
  }
`;

export const StyledHeading3 = styled.h3`
  font-size: 2.67rem;

  @media ${mobileLandscape} {
    font-size: 1.8rem;
  }

  @media ${tablet} {
    font-size: 2.3rem;
  }

  @media ${desktop} {
    font-size: 2.375rem;
  }
`;

export const paragraph1Styles = `
  font-size: 2.67rem;
  font-weight: 500;

  @media ${mobileLandscape} {
    font-size: 1.8rem;
  }

  @media ${tablet} {
    font-size: 1.7rem;
  }

  @media ${desktop} {
    font-size: 1.75rem;
  }
`;

export const StyledParagraph1 = styled.p`
  ${paragraph1Styles}
`;

export const StyledParagraph1Bold = styled(StyledParagraph1)`
  font-weight: 700;
`;

export const paragraph2Styles = `
    font-size: 2.33rem;
    font-weight: 500;

    @media ${mobileLandscape} {
    font-size: 1.6rem;
    }

    @media ${tablet} {
    font-size: 1.4rem;
    }

    @media ${desktop} {
    font-size: 1.5rem;
    }
`;

export const StyledParagraph2 = styled.p`
  ${paragraph2Styles}
`;

export const StyledParagraph3 = styled.p`
  font-size: 2.17rem;
  font-weight: 500;

  @media ${mobileLandscape} {
    font-size: 1.5rem;
  }

  @media ${tablet} {
    font-size: 1.14rem;
  }

  @media ${desktop} {
    font-size: 1.25rem;
  }
`;

export const paragraph4Styles = `
  font-size: 2rem;
  font-weight: 500;

  @media ${mobileLandscape} {
    font-size: 1.4rem;
  }

  @media ${tablet} {
    font-size: 1rem;
  }

  @media ${desktop} {
    font-size: 1rem;
  }
`;

export const StyledParagraph4 = styled.p`
  ${paragraph4Styles}
`;

export const StyledParagraph4Bold = styled(StyledParagraph4)`
  font-weight: 700;
`;
