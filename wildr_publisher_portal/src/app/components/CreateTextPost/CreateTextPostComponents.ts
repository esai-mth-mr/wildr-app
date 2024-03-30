import { styled } from 'styled-components';
const theme = {
  colors: {
    backgroundColor: '#4caf50',
    hoverBackgroundColor: '#45a050',
    textColor: '#fff',
  },
};
export const FormWrapper = styled.form`
  height: 35rem;
  display: flex;
  flex-direction: column;
  max-width: 25rem;
  padding: 1.25rem;
  border-radius: 0.625rem;
  box-shadow: 0 0.125rem 0.3125rem rgba(0, 0, 0, 0.1);
`;

export const Input = styled.input`
  box-sizing: border-box;
  width: 25rem;
  height: 100%;
  border: 1px solid transparent;
  margin-bottom: 1.5rem;
  border-radius: 0.625rem;
  box-shadow: 0 0.125rem 0.3125rem rgba(0, 0, 0, 0.1);
  &:hover {
    outline: none;
    border: 1px solid ${theme.colors.backgroundColor};
  }
  &:focus {
    outline: none;
    border: 1px solid ${theme.colors.backgroundColor};
  }
`;
export const SubmitButton = styled.button`
  padding: 0.625rem;
  background-color: ${theme.colors.backgroundColor};
  color: ${theme.colors.textColor};
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;

  &:hover {
    background-color: ${theme.colors.hoverBackgroundColor};
  }
`;
