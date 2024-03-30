import { DefaultLayoutProps } from '@/types';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Terms Of Service',
};

const TermsLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  return children;
};

export default TermsLayout;
