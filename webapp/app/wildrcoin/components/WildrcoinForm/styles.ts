import { StyledParagraph4, paragraph4Styles } from '@/app/globalStyles';
import { desktop } from '@/mediaQueries';
import styled from 'styled-components';

export const StyledFormWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;

  @media ${desktop} {
    align-items: flex-start;
  }

  .swiper {
    width: 100%;
    height: 100%;

    .swiper-slide {
      padding: 0 30px;
    }

    .swiper-slide-active {
      padding: 0;
    }
  }
`;

export const StyledWildrcoinForm = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 508px;
  margin: 0 auto;

  @media ${desktop} {
    flex-direction: row;
    align-items: center;
    height: 3.375rem;
    margin: unset;
  }

  input {
    height: 50px;
    width: 100%;
    padding: ${({ theme }) => theme.spaces.space2};
    border: 1px solid ${({ theme }) => theme.colors.primaryText};
    border-radius: 0.5rem;
    margin-bottom: ${({ theme }) => theme.spaces.space2};
    ${paragraph4Styles}

    @media ${desktop} {
      height: 100%;
      width: calc(100% - 10rem);
      border-radius: unset;
      margin-bottom: 0;
      border-bottom-left-radius: 0.75rem;
      border-top-left-radius: 0.75rem;
    }
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${({ theme }) => theme.colors.primaryText};
    color: ${({ theme }) => theme.colors.primary};
    height: 60px;
    width: 100%;
    padding: ${({ theme }) => `${theme.spaces.space2} ${theme.spaces.space3}`};
    border: 1px solid ${({ theme }) => theme.colors.primaryText};
    border-radius: 6.25rem;

    @media ${desktop} {
      height: 100%;
      width: 10rem;
      border-radius: unset;
      border-top-right-radius: 0.75rem;
      border-bottom-right-radius: 0.75rem;
    }
  }
`;

export const StyledError = styled.div`
  position: absolute;
  top: ${({ theme }) => `-${theme.spaces.space5}`};
  left: 0;
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spaces.space2};

  img {
    margin-right: ${({ theme }) => theme.spaces.space1};
  }

  p {
    color: #68696f;
  }
`;

export const StyledSuccess = styled.div`
  display: flex;
  align-items: flex-start;
  width: 100%;

  img {
    margin: ${({ theme }) =>
      `${theme.spaces.space1} ${theme.spaces.space1} 0 0`};
  }

  p {
    max-width: 412px;
    color: #68696f;
  }
`;

export const StyledWildrcoinLink = styled(StyledParagraph4)`
  color: #68696f;
  margin-top: ${({ theme }) => theme.spaces.space3};
  max-width: 420px;
  text-align: center;

  @media ${desktop} {
    text-align: left;
  }

  a {
    cursor: pointer;
    text-decoration: underline;
    color: inherit;
  }
`;
