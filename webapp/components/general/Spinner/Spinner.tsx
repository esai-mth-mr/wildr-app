import React from 'react';
import { StyledSpinner } from './styles';
import { useTheme } from 'styled-components';

type SpinnerProps = {
  width?: string;
  height?: string;
  color?: string;
  size?: string;
};

export const Spinner: React.FC<SpinnerProps> = ({
  width = '2rem',
  height = '2rem',
  color,
  size = '0.5rem',
}) => {
  const theme = useTheme();
  const assignedColor = color ?? theme.colors.primaryText;
  return (
    <StyledSpinner
      width={width}
      height={height}
      color={assignedColor}
      size={size}
    />
  );
};
