import { styled } from 'styled-components';

const theme = {
  colors: {
    backgroundColor: '#4caf50',
    hoverBackgroundColor: '#45a050',
    textColor: '#fff',
  },
};
export const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 35rem;
  flex-direction: column;
  width: 25rem;
  max-width: 25rem;
  padding: 1.25rem;
  border-radius: 0.625rem;
  box-shadow: 0 0.125rem 0.3125rem rgba(0, 0, 0, 0.1);
`;

export const FileInput = styled.input`
  display: none;
`;
export const Label = styled.label`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  cursor: pointer;
  border: 1px solid transparent;
  margin-bottom: 1.5rem;
  border-radius: 0.625rem;
  box-shadow: 0 0.125rem 0.3125rem rgba(0, 0, 0, 0.1);
  &:hover {
    border: 1px solid ${theme.colors.backgroundColor};
  }
`;

export const Text = styled.p`
  margin: 0;
  padding: 0;
  font-size: 16px;
  color: #666;
`;

export const SubmitButton = styled.button`
  width: 100%;
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
