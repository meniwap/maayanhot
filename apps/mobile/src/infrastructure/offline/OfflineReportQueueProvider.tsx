import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system/legacy';
import * as Network from 'expo-network';
import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createSupabaseUploadAdapter, toPreparedUploadAsset } from '@maayanhot/upload-core';
import type { PreparedUploadAsset, UploadAssetDescriptor } from '@maayanhot/upload-core';
import { AppState, type AppStateStatus } from 'react-native';

import { useDevSession } from '../../features/dev-session/DevSessionProvider';
import { useMobileObservability } from '../observability/MobileObservabilityProvider';
import { getSupabaseClient, isSupabaseClientConfigured } from '../supabase/client';
import { springReportRepository } from '../supabase/repositories/spring-report-repository';
import { createExpoImageUploadPreprocessor } from '../upload/mobile-image-preprocessor';
import {
  OfflineReportQueueController,
  type OfflineReportQueueSnapshot,
  type OfflineReportSubmissionResult,
  type SubmitSpringReportDraft,
} from './offline-report-queue';

type OfflineReportQueueContextValue = {
  discardPreparedAttachment: (attachment: UploadAssetDescriptor) => Promise<void>;
  discardQueuedReport: (queueId: string) => Promise<void>;
  prepareAttachment: (asset: UploadAssetDescriptor) => Promise<PreparedUploadAsset>;
  retryQueuedReport: (queueId: string) => Promise<void>;
  snapshot: OfflineReportQueueSnapshot;
  submitDraft: (draft: SubmitSpringReportDraft) => Promise<OfflineReportSubmissionResult>;
};

const inertController = {
  async discardPreparedAttachment() {
    return undefined;
  },
  async discardQueuedReport() {
    return undefined;
  },
  async prepareAttachment(asset: UploadAssetDescriptor) {
    return toPreparedUploadAsset(asset);
  },
  async retryQueuedReport() {
    return undefined;
  },
  async submitDraft() {
    throw new Error('Offline report queue is not configured.');
  },
  snapshot: {
    activeUserId: null,
    isAppActive: true,
    isHydrated: true,
    isOnline: true,
    items: [],
    recentDeliveries: [],
  } satisfies OfflineReportQueueSnapshot,
};

export const OfflineReportQueueContext =
  createContext<OfflineReportQueueContextValue>(inertController);

export function OfflineReportQueueProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const { snapshot: sessionSnapshot } = useDevSession();
  const observability = useMobileObservability();
  const [controller] = useState(
    () =>
      new OfflineReportQueueController({
        analyticsTracker: observability.analytics,
        assetPreprocessor: createExpoImageUploadPreprocessor(),
        clearScheduled: (handle) => clearTimeout(handle),
        errorReporter: observability.errors,
        fileSystem: FileSystem,
        now: () => Date.now(),
        queryClient,
        reportRepository: springReportRepository,
        schedule: (callback, delayMs) => setTimeout(callback, delayMs),
        storage: AsyncStorage,
        uploadAdapter: isSupabaseClientConfigured()
          ? createSupabaseUploadAdapter(getSupabaseClient())
          : {
              retry: async () => {
                throw new Error('Supabase upload flow is not configured.');
              },
              upload: async () => {
                throw new Error('Supabase upload flow is not configured.');
              },
              validate: () => undefined,
            },
      }),
  );
  const [queueSnapshot, setQueueSnapshot] = useState<OfflineReportQueueSnapshot>(() =>
    controller.getSnapshot(),
  );

  useEffect(
    () => controller.subscribe(() => setQueueSnapshot(controller.getSnapshot())),
    [controller],
  );

  useEffect(() => {
    void controller.hydrate();
  }, [controller]);

  useEffect(() => {
    const applyNetworkState = (state: Awaited<ReturnType<typeof Network.getNetworkStateAsync>>) => {
      controller.setOnline(Boolean(state.isInternetReachable ?? state.isConnected));
    };

    void Network.getNetworkStateAsync().then(applyNetworkState);
    const subscription = Network.addNetworkStateListener(applyNetworkState);

    return () => {
      subscription.remove();
    };
  }, [controller]);

  useEffect(() => {
    controller.setAppActive(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      controller.setAppActive(nextState === 'active');
    });

    return () => {
      subscription.remove();
    };
  }, [controller]);

  useEffect(() => {
    void controller.setActiveUser(
      sessionSnapshot.status === 'authenticated' ? sessionSnapshot.userId : null,
    );
  }, [controller, sessionSnapshot.status, sessionSnapshot.userId]);

  const value = useMemo<OfflineReportQueueContextValue>(
    () => ({
      discardPreparedAttachment: (attachment) => controller.discardPreparedAttachment(attachment),
      discardQueuedReport: (queueId) => controller.discard(queueId),
      prepareAttachment: (asset) => controller.prepareAttachment(asset),
      retryQueuedReport: (queueId) => controller.retryNow(queueId),
      snapshot: queueSnapshot,
      submitDraft: async (draft) => {
        if (sessionSnapshot.status !== 'authenticated' || !sessionSnapshot.userId) {
          throw new Error('Authenticated session required to queue or submit a report.');
        }

        return controller.submitDraft(draft, sessionSnapshot.userId);
      },
    }),
    [controller, queueSnapshot, sessionSnapshot.status, sessionSnapshot.userId],
  );

  return (
    <OfflineReportQueueContext.Provider value={value}>
      {children}
    </OfflineReportQueueContext.Provider>
  );
}

export const useOfflineReportQueue = () => useContext(OfflineReportQueueContext);
