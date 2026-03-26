import type { UserRole } from '@maayanhot/contracts';
import type { UserProfile } from '@maayanhot/domain';
import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { mobileAppEnv } from '../../infrastructure/env';
import {
  getSupabaseClient,
  isSupabaseClientConfigured,
} from '../../infrastructure/supabase/client';
import { userProfileRepository } from '../../infrastructure/supabase/repositories/user-profile-repository';

export type DevSessionSnapshot = {
  email: string | null;
  isConfigured: boolean;
  isDevSessionEnabled: boolean;
  primaryRole: UserRole | null;
  roleSet: UserRole[];
  status: 'anonymous' | 'authenticated' | 'loading';
  userId: string | null;
};

type DevSessionContextValue = {
  signInAsDemoAdmin: () => Promise<void>;
  signInAsDemoUser: () => Promise<void>;
  signOut: () => Promise<void>;
  snapshot: DevSessionSnapshot;
};

const defaultSnapshot: DevSessionSnapshot = {
  email: null,
  isConfigured: isSupabaseClientConfigured(),
  isDevSessionEnabled: mobileAppEnv.devSessionEnabled,
  primaryRole: null,
  roleSet: [],
  status: 'anonymous',
  userId: null,
};

const defaultContext: DevSessionContextValue = {
  signInAsDemoAdmin: async () => undefined,
  signInAsDemoUser: async () => undefined,
  signOut: async () => undefined,
  snapshot: defaultSnapshot,
};

export const DevSessionContext = createContext<DevSessionContextValue>(defaultContext);

const toSnapshot = (
  profile: UserProfile | null,
  email: string | null,
  userId: string | null,
): DevSessionSnapshot => {
  if (!profile || !userId) {
    return {
      ...defaultSnapshot,
      email,
      status: 'authenticated',
      userId,
    };
  }

  return {
    email,
    isConfigured: defaultSnapshot.isConfigured,
    isDevSessionEnabled: defaultSnapshot.isDevSessionEnabled,
    primaryRole: profile.primaryRole,
    roleSet: profile.roleSet,
    status: 'authenticated',
    userId,
  };
};

export function DevSessionProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = useState<DevSessionSnapshot>(() => defaultSnapshot);

  useEffect(() => {
    if (!isSupabaseClientConfigured()) {
      return;
    }

    const client = getSupabaseClient();

    const refreshSnapshot = async () => {
      const {
        data: { user },
      } = await client.auth.getUser();

      if (!user) {
        setSnapshot(defaultSnapshot);
        return;
      }

      const profile = await userProfileRepository.getById(user.id);

      setSnapshot(toSnapshot(profile, user.email ?? null, user.id));
    };

    setSnapshot((current) => ({ ...current, status: 'loading' }));
    void refreshSnapshot();

    const subscription = client.auth.onAuthStateChange(() => {
      void refreshSnapshot();
    });

    return () => {
      subscription.data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<DevSessionContextValue>(
    () => ({
      signInAsDemoAdmin: async () => {
        const client = getSupabaseClient();

        if (!mobileAppEnv.devAdminEmail || !mobileAppEnv.devAdminPassword) {
          throw new Error('Missing development admin credentials.');
        }

        const { error } = await client.auth.signInWithPassword({
          email: mobileAppEnv.devAdminEmail,
          password: mobileAppEnv.devAdminPassword,
        });

        if (error) {
          throw new Error(error.message);
        }
      },
      signInAsDemoUser: async () => {
        const client = getSupabaseClient();

        if (!mobileAppEnv.devUserEmail || !mobileAppEnv.devUserPassword) {
          throw new Error('Missing development user credentials.');
        }

        const { error } = await client.auth.signInWithPassword({
          email: mobileAppEnv.devUserEmail,
          password: mobileAppEnv.devUserPassword,
        });

        if (error) {
          throw new Error(error.message);
        }
      },
      signOut: async () => {
        if (!isSupabaseClientConfigured()) {
          return;
        }

        const client = getSupabaseClient();
        const { error } = await client.auth.signOut();

        if (error) {
          throw new Error(error.message);
        }
      },
      snapshot,
    }),
    [snapshot],
  );

  return <DevSessionContext.Provider value={value}>{children}</DevSessionContext.Provider>;
}

export const useDevSession = () => useContext(DevSessionContext);
