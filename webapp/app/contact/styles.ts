import { desktop, mobileLandscape, tablet } from '@/mediaQueries';
import styled from 'styled-components';
import { paragraph4Styles } from '../globalStyles';

export const StyledContactContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 90vh;
  padding: 0 ${({ theme }) => theme.spaces.space6};
  grid-column-gap: ${({ theme }) => theme.spaces.space6};

  @media ${desktop} {
    flex-direction: row;
  }
`;

export const StyledTitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${({ theme }) => theme.spaces.space3};
  width: 100%;
  text-align: left;

  @media ${tablet} {
    max-width: 630px;
  }

  @media ${desktop} {
    margin-bottom: 0;
    max-width: 530px;
  }

  h2 {
    margin-bottom: ${({ theme }) => theme.spaces.space3};
  }

  p {
    max-width: 450px;

    @media ${tablet} {
      max-width: unset;
    }
  }
`;

export const StyledFormContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 620px;
  width: 100%;
`;

export const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  color: ${({ theme }) => theme.colors.primaryText};
  padding: ${({ theme }) => theme.spaces.space4} 0;
  border-radius: 1rem;
  grid-row-gap: ${({ theme }) => theme.spaces.space3};

  input,
  textarea {
    border: 1px solid ${({ theme }) => theme.colors.secondaryLayer};
    padding: 16px;
    color: inherit;
    border-radius: 6px;
    width: 100%;
    ${paragraph4Styles}

    &::placeholder {
      color: inherit;
    }
  }

  input {
    height: 50px;
  }

  textarea {
    height: 90px;
  }

  button {
    background-color: ${({ theme }) => theme.colors.brandGreen};
    color: ${({ theme }) => theme.colors.primary};
    border: none;
    border-radius: 8px;
    padding: ${({ theme }) => `${theme.spaces.space2} ${theme.spaces.space3}`};
    width: fit-content;
    cursor: pointer;
  }
`;

export const StyledCaptcha = styled.div`
  transform: scale(84%) translateX(-10%);

  @media ${mobileLandscape} {
    transform: none;
  }
`;

export const StyledContactSuccess = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.brandGreen};
  width: 100%;
  padding: ${({ theme }) => theme.spaces.space3};
  border-radius: 0.5rem;

  p {
    color: ${({ theme }) => theme.colors.primary};
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
`;

export const StyledErrorContent = styled.div`
  background-color: ${({ theme }) => theme.colors.errorRed};
  padding: ${({ theme }) => theme.spaces.space2};
  border-radius: 0.375rem;
  width: 100%;
  margin-top: ${({ theme }) => theme.spaces.space2};

  p {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 500;
  }
`;
