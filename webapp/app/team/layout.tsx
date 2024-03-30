import { DefaultLayoutProps } from '@/types';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Team',
};

const TeamLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  return children;
};

export default TeamLayout;
