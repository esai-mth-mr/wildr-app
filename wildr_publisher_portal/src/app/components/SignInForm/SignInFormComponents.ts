'use client';
import styled from 'styled-components';

export const theme = {
  colors: {
    primary: '#3498db',
    secondary: '#dd4b39',
    background: '#fff',
    text: '#333',
    grey: '#808080',
  },
  fonts: {
    sizeSx: '0.85rem',
    sizeSm: '1rem',
    sizeMd: '1.5rem',
    sizeLg: '2rem',
  },
  paddings: {
    paddingSm: '0.625rem',
    paddingMd: '0.75rem',
  },
  margins: {
    marginSm: '0.5rem',
    marginMd: '1rem',
    marginLg: '2rem',
  },
  borderRadius: '0.5rem',
  boxShadow: '0 0 0.625rem rgba(0, 0, 0, 0.1)',
  transition: '0.3s',
};

export const SignInContainer = styled.div`
  min-width: 15rem;
  max-width: 25rem;
  margin: 10rem auto;
  padding: ${theme.paddings.paddingMd};
  border: 1px solid ${theme.colors.text};
  border-radius: ${theme.borderRadius};
  box-shadow: ${theme.boxShadow};
  transition: ${theme.transition};
`;

export const SignInTitle = styled.h2`
  font-size: ${theme.fonts.sizeMd};
  margin-bottom: ${theme.margins.marginMd};
  color: ${theme.colors.primary};
`;

export const SignInFormWrapper = styled.form`
  margin-bottom: ${theme.margins.marginMd};
`;

export const FormGroup = styled.div`
  margin-bottom: ${theme.margins.marginMd};
`;

export const SignInLabel = styled.label`
  display: block;
  margin-bottom: ${theme.margins.marginSm};
  color: ${theme.colors.text};
  font-weight: bold;
`;

export const SignInInput = styled.input`
  width: 100%;
  padding: ${theme.paddings.paddingSm};
  font-size: ${theme.fonts.sizeSm};
  border: 1px solid ${theme.colors.text};
  border-radius: ${theme.borderRadius};
  transition: border-color ${theme.transition};
  box-sizing: border-box;

  &:focus {
    border-color: ${theme.colors.primary};
    outline: none;
  }
`;

export const Separator = styled.p`
  color: ${theme.colors.grey};
  overflow: hidden;
  text-align: center;
  margin-bottom: ${theme.margins.marginMd};
  &:before,
  &:after {
    background-color: ${theme.colors.grey};
    content: '';
    display: inline-block;
    height: 1px;
    position: relative;
    vertical-align: middle;
    width: 50%;
  }
  &:before {
    right: 0.5em;
    margin-left: -50%;
  }
  &:after {
    left: 0.5em;
    margin-right: -50%;
  }
`;

export const Button = styled.button`
  width: 100%;
  padding: ${theme.paddings.paddingMd};
  background-color: ${theme.colors.primary};
  color: ${theme.colors.background};
  border: none;
  border-radius: ${theme.borderRadius};
  cursor: pointer;
  transition: background-color ${theme.transition};
  font-size: ${theme.fonts.sizeSm};
`;

export const SocialLogin = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
`;

export const GoogleSignInButton = styled(Button)`
  background-color: ${theme.colors.secondary};
  margin-bottom: 1rem;
`;

export const AppleSignInButton = styled(Button)`
  background-color: ${theme.colors.text};
`;

export const Caption = styled.p`
  font-size: ${theme.fonts.sizeSx};
  text-align: center;
`;
