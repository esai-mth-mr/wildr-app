import { styled } from 'styled-components';

const theme = {
  colors: {
    backgroundColorPrimary: '#ffffff',
    backgroundColorSecondary: '#45a049',
    titleColor: '#3b3b3b',
    borderColor: '#ccc',
  },
};

export const Container = styled.div`
  height: 35rem;
  width: 25rem;
  padding: 1.25rem;
  border-radius: 1rem;
  box-shadow: 0 0.125rem 0.3125rem rgba(0, 0, 0, 0.1);
`;

export const ToggleInput = styled.input`
  position: relative;
  display: inline-block;
  width: 3.3rem;
  height: 1.5rem;
  margin: 0;
  vertical-align: top;
  background: ${theme.colors.backgroundColorPrimary};
  border: 0.125rem solid ${theme.colors.backgroundColorSecondary};
  border-radius: 1.875rem;
  outline: none;
  cursor: pointer;
  appearance: none;
  transition: background-color 0.3s, border-color 0.3s;

  &:after {
    content: '';
    display: inline-block;
    position: absolute;
    left: -1.4rem;
    top: 0.18rem;
    width: 1rem;
    height: 1rem;
    background-color: ${theme.colors.backgroundColorSecondary};
    border-radius: 50%;
    transition: transform 0.3s, background-color 0.3s;
    transform: translateX(1.5rem);
  }

  &:checked::after {
    transform: translateX(calc(3.4rem));
    background-color: ${theme.colors.backgroundColorPrimary};
  }

  &:checked {
    background-color: ${theme.colors.backgroundColorSecondary};
    border-color: ${theme.colors.backgroundColorSecondary};
  }
`;

export const SectionTitle = styled.p`
  font-size: 1.2rem;
  font-weight: bold;
  color: ${theme.colors.titleColor};
  margin-bottom: 0.6rem;
  text-align: center;
`;

export const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

export const FormGroupCheckbox = styled(FormGroup)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 0.3rem;
  font-size: 1rem;
  color: #5e5e5e;
`;
export const PostType = styled.span`
  font-weight: bold;
`;

export const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 0.0625rem solid ${theme.colors.borderColor};
  border-radius: 0.3rem;
  font-size: 1rem;
  background-color: ${theme.colors.backgroundColorPrimary};
  color: ${theme.colors.titleColor};
  outline: none;
  transition: border-color 0.3s;

  &:hover,
  &:focus {
    border-color: ${theme.colors.backgroundColorSecondary};
  }
`;

export const TextArea = styled.textarea`
  box-sizing: border-box;
  width: 100%;
  height: 5rem;
  padding: 0.5rem;
  border: 0.0625rem solid ${theme.colors.borderColor};
  border-radius: 0.25rem;
  resize: none;
  outline: none;

  &:focus {
    border-color: ${theme.colors.backgroundColorSecondary};
  }
`;
