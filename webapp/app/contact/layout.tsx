import { DefaultLayoutProps } from '@/types';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Contact',
};

const ContactLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  return children;
};

export default ContactLayout;
