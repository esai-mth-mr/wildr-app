import styled, { keyframes } from 'styled-components';

const spin = keyframes`
    0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

export const StyledSpinner = styled.span<{
  width: string;
  height: string;
  color: string;
  size: string;
}>`
  width: ${({ width }) => width};
  height: ${({ height }) => height};
  border: ${({ size, theme }) => `${size} solid ${theme.colors.primaryLayer}`};
  border-top: ${({ size, color }) => `${size} solid ${color}`};
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: ${spin} 1s linear infinite;
`;
