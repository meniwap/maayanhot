'use client';

import type { UserRole } from '@maayanhot/contracts';
import type { UserProfile } from '@maayanhot/domain';
import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getSupabaseClient, isSupabaseClientConfigured } from '../supabase/client';
import { userProfileRepository } from '../supabase/repositories/user-profile-repository';

export type AdminSessionSnapshot = {
  email: string | null;
  isConfigured: boolean;
  primaryRole: UserRole | null;
  roleSet: UserRole[];
  status: 'anonymous' | 'authenticated' | 'loading';
  userId: string | null;
};

type AdminSessionContextValue = {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  snapshot: AdminSessionSnapshot;
};

const defaultSnapshot: AdminSessionSnapshot = {
  email: null,
  isConfigured: isSupabaseClientConfigured(),
  primaryRole: null,
  roleSet: [],
  status: isSupabaseClientConfigured() ? 'loading' : 'anonymous',
  userId: null,
};

const defaultContext: AdminSessionContextValue = {
  signIn: async () => undefined,
  signOut: async () => undefined,
  snapshot: defaultSnapshot,
};

export const AdminSessionContext = createContext<AdminSessionContextValue>(defaultContext);

const toSnapshot = (
  profile: UserProfile | null,
  email: string | null,
  userId: string | null,
): AdminSessionSnapshot => {
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
    primaryRole: profile.primaryRole,
    roleSet: profile.roleSet,
    status: 'authenticated',
    userId,
  };
};

export function AdminSessionProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = useState<AdminSessionSnapshot>(() => defaultSnapshot);
  const refreshSnapshot = useCallback(async () => {
    const client = getSupabaseClient();
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      setSnapshot(defaultSnapshot);
      return;
    }

    const profile = await userProfileRepository.getById(user.id);

    setSnapshot(toSnapshot(profile, user.email ?? null, user.id));
  }, []);

  useEffect(() => {
    if (!isSupabaseClientConfigured()) {
      return;
    }

    const client = getSupabaseClient();

    setSnapshot((current) => ({ ...current, status: 'loading' }));
    void refreshSnapshot();

    const subscription = client.auth.onAuthStateChange(() => {
      void refreshSnapshot();
    });

    return () => {
      subscription.data.subscription.unsubscribe();
    };
  }, [refreshSnapshot]);

  const value = useMemo<AdminSessionContextValue>(
    () => ({
      signIn: async (email, password) => {
        const client = getSupabaseClient();
        const { error } = await client.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw new Error(error.message);
        }

        await refreshSnapshot();
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

        setSnapshot(defaultSnapshot);
      },
      snapshot,
    }),
    [refreshSnapshot, snapshot],
  );

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export const useAdminSession = () => useContext(AdminSessionContext);
