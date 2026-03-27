import type { UploadAssetDescriptor } from '@maayanhot/upload-core';

import type {
  OfflineReportSubmissionResult,
  ReportAttachmentDraft,
  SubmitSpringReportDraft,
} from '../offline/offline-report-queue';

type ReportQueueDriver = {
  discardPreparedAttachment: (attachment: UploadAssetDescriptor) => Promise<void>;
  prepareAttachment: (asset: UploadAssetDescriptor) => Promise<ReportAttachmentDraft>;
  retryQueuedReport: (queueId: string) => Promise<void>;
  submitDraft: (draft: SubmitSpringReportDraft) => Promise<OfflineReportSubmissionResult>;
};

export type { ReportAttachmentDraft, SubmitSpringReportDraft };

export class SubmitReportFlow {
  constructor(private readonly queueDriver: ReportQueueDriver) {}

  async prepareAttachment(asset: UploadAssetDescriptor) {
    return this.queueDriver.prepareAttachment(asset);
  }

  async discardPreparedAttachment(attachment: UploadAssetDescriptor) {
    return this.queueDriver.discardPreparedAttachment(attachment);
  }

  async retryQueuedReport(queueId: string) {
    return this.queueDriver.retryQueuedReport(queueId);
  }

  async submit(input: SubmitSpringReportDraft) {
    return this.queueDriver.submitDraft(input);
  }
}
