export type AnalyticsEventName =
  | 'admin_login_failed'
  | 'admin_login_succeeded'
  | 'admin_spring_saved'
  | 'moderation_decision_submitted'
  | 'report_attachment_preprocessed'
  | 'report_attachment_rejected_large'
  | 'report_queue_enqueued'
  | 'report_queue_failed_permanent'
  | 'report_queue_replay_started'
  | 'report_queue_replay_succeeded'
  | 'report_queue_retry_scheduled';

export type AnalyticsEvent = {
  metadata?: Record<string, unknown>;
  name: AnalyticsEventName;
};

export type ErrorReportContext = {
  action?: string;
  code?: string | null;
  feature: string;
  metadata?: Record<string, unknown>;
  severity?: 'error' | 'fatal' | 'warning';
};

export interface ErrorReporter {
  captureError(error: unknown, context: ErrorReportContext): void | Promise<void>;
}

export interface AnalyticsTracker {
  track(event: AnalyticsEvent): void | Promise<void>;
}

export type Observability = {
  analytics: AnalyticsTracker;
  errors: ErrorReporter;
};

export const createNoopErrorReporter = (): ErrorReporter => ({
  captureError: () => undefined,
});

export const createNoopAnalyticsTracker = (): AnalyticsTracker => ({
  track: () => undefined,
});

export const createNoopObservability = (): Observability => ({
  analytics: createNoopAnalyticsTracker(),
  errors: createNoopErrorReporter(),
});

export type RecordedAnalyticsEvent = AnalyticsEvent & {
  recordedAt: string;
};

export type RecordedErrorEvent = ErrorReportContext & {
  error: unknown;
  recordedAt: string;
};

export const createMemoryObservability = () => {
  const analytics: RecordedAnalyticsEvent[] = [];
  const errors: RecordedErrorEvent[] = [];

  return {
    analytics,
    observability: {
      analytics: {
        track(event) {
          analytics.push({
            ...event,
            metadata: event.metadata ?? {},
            recordedAt: new Date().toISOString(),
          });
        },
      },
      errors: {
        captureError(error, context) {
          errors.push({
            ...context,
            error,
            metadata: context.metadata ?? {},
            recordedAt: new Date().toISOString(),
            severity: context.severity ?? 'error',
          });
        },
      },
    } satisfies Observability,
    errors,
    reset() {
      analytics.length = 0;
      errors.length = 0;
    },
  };
};
