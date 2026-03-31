import React from 'react';
import { useRouter } from 'expo-router';

import { AboutScreen } from '../src/features/about/AboutScreen';

export default function AboutRoute() {
  const router = useRouter();

  return (
    <AboutScreen
      onBack={() => router.back()}
      onOpenPrivacy={() => router.push('/legal/privacy')}
      onOpenTerms={() => router.push('/legal/terms')}
    />
  );
}
