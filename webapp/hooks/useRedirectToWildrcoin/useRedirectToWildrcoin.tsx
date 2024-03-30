'use client';

import { RedirectType, redirect } from 'next/navigation';
import { useEffect } from 'react';

export const useRedirectToWildrcoin = () => {
  const isWaitlistSeen = localStorage.getItem('isWaitlistSeen') === 'true';

  useEffect(() => {
    if (isWaitlistSeen) return;

    localStorage.setItem('isWaitlistSeen', 'true');
    return redirect('/wildrcoin', RedirectType.push);
  }, [isWaitlistSeen]);
};
