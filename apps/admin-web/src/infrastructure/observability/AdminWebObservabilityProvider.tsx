'use client';

import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { createNoopObservability, type Observability } from '@maayanhot/observability-core';

const defaultObservability = createNoopObservability();

export const AdminWebObservabilityContext = createContext<Observability>(defaultObservability);

export function AdminWebObservabilityProvider({ children }: PropsWithChildren) {
  const observability = useMemo(() => createNoopObservability(), []);

  return (
    <AdminWebObservabilityContext.Provider value={observability}>
      {children}
    </AdminWebObservabilityContext.Provider>
  );
}

export const useAdminWebObservability = () => useContext(AdminWebObservabilityContext);
