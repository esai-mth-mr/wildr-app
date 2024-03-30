import React, { ReactNode } from 'react';
import { Wrapper } from '@/app/components/Container/ContainerComponents';

interface ContainerProps {
  children: ReactNode;
}

const Container: React.FC<ContainerProps> = ({ children }) => {
  return <Wrapper>{children}</Wrapper>;
};

export default Container;
