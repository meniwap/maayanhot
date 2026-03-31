import {
  createNoopObservability,
  type ErrorReporter,
  type Observability,
} from '@maayanhot/observability-core';
import type { PropsWithChildren } from 'react';
import React, { Component, createContext, useContext, useMemo } from 'react';

type AppErrorBoundaryProps = PropsWithChildren<{
  reporter: ErrorReporter;
}>;

type AppErrorBoundaryState = {
  hasError: boolean;
};

const defaultObservability = createNoopObservability();

export const MobileObservabilityContext = createContext<Observability>(defaultObservability);

class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  override state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    void this.props.reporter.captureError(error, {
      action: 'render',
      feature: 'mobile_root',
      metadata: {
        componentStack: errorInfo.componentStack,
      },
      severity: 'fatal',
    });
  }

  override render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

export function MobileObservabilityProvider({ children }: PropsWithChildren) {
  const observability = useMemo(() => createNoopObservability(), []);

  return (
    <MobileObservabilityContext.Provider value={observability}>
      <AppErrorBoundary reporter={observability.errors}>{children}</AppErrorBoundary>
    </MobileObservabilityContext.Provider>
  );
}

export const useMobileObservability = () => useContext(MobileObservabilityContext);
