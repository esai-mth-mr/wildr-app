import { DefaultLayoutProps } from '@/types';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Community Guidelines',
};

const CommunityGuidelinesLayout: React.FC<DefaultLayoutProps> = ({
  children,
}) => {
  return children;
};

export default CommunityGuidelinesLayout;
