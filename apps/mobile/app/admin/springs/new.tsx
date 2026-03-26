import { useRouter } from 'expo-router';
import React from 'react';

import { AdminSpringCreateScreen } from '../../../src/features/admin-spring-create/AdminSpringCreateScreen';

export default function AdminCreateSpringRoute() {
  const router = useRouter();

  return (
    <AdminSpringCreateScreen
      onBack={() => router.back()}
      onOpenPublishedSpring={(springId: string) =>
        router.replace({
          params: {
            springId,
          },
          pathname: '/springs/[springId]',
        })
      }
    />
  );
}
