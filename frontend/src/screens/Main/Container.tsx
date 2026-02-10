import React, { useEffect, useState } from 'react';
import { Splash } from '../Splash';
import { Navigation } from './Navigation';

const SPLASH_DURATION_MS = 11_000;

export function MainContainer() {
  const [isSplashVisible, setIsSplashVisible] = useState<boolean>(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setIsSplashVisible(false);
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  if (isSplashVisible) {
    return <Splash />;
  }

  return <Navigation />;
}
