import { DefaultLayoutProps } from '@/types';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

const PrivacyLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  return children;
};

export default PrivacyLayout;
