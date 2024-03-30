import React from 'react';
import { redirect } from 'next/navigation';

const NotFound: React.FC = () => {
  return redirect('/download');
};

export default NotFound;
