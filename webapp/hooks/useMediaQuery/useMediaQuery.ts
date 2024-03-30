'use client';
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>();

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = () => setMatches(!!mediaQueryList.matches);
    listener();
    mediaQueryList.addEventListener('change', listener); // updated from .addListener
    return () => mediaQueryList.removeEventListener('change', listener); // updated from .removeListener
  }, [query]);

  return !!matches;
}
