import { moderateReportCommandSchema } from '@maayanhot/contracts';
import {
  deriveSpringStatusProjection,
  shouldReplaceSpringStatusProjection,
  type ModerationQueueRepository,
  type SpringReportRepository,
  type SpringStatusProjectionRepository,
} from '@maayanhot/domain';
import type { QueryClient } from '@tanstack/react-query';

export type ModerateReportFlowResult = {
  decision: 'approve' | 'reject';
  projection: Awaited<ReturnType<SpringStatusProjectionRepository['upsert']>>;
  reportId: string;
  springId: string;
};

export class ModerateReportFlow {
  constructor(
    private readonly moderationQueueRepository: ModerationQueueRepository,
    private readonly springReportRepository: SpringReportRepository,
    private readonly springStatusProjectionRepository: SpringStatusProjectionRepository,
    private readonly queryClient: QueryClient,
  ) {}

  async submit(input: Parameters<typeof moderateReportCommandSchema.parse>[0]) {
    const parsed = moderateReportCommandSchema.parse(input);
    const review = await this.moderationQueueRepository.getReviewByReportId(parsed.reportId);

    if (!review) {
      throw new Error('הדיווח כבר לא זמין בתור הממתין לבדיקה.');
    }

    const action = await this.moderationQueueRepository.applyDecision({
      decision: parsed.decision,
      reportId: parsed.reportId,
      ...(parsed.reasonCode !== undefined ? { reasonCode: parsed.reasonCode } : {}),
      ...(parsed.reasonNote !== undefined ? { reasonNote: parsed.reasonNote } : {}),
    });

    const reports = await this.springReportRepository.listBySpringId(review.review.springId);
    const mediaByReportId =
      reports.length > 0
        ? await this.springReportRepository.listMediaByReportIds(reports.map((report) => report.id))
        : {};
    const derivedProjection = deriveSpringStatusProjection({
      mediaByReportId,
      now: action.actedAt,
      reports,
      springId: review.review.springId,
    });
    const existingProjection = await this.springStatusProjectionRepository.getBySpringId(
      review.review.springId,
    );
    const projection = shouldReplaceSpringStatusProjection(existingProjection, derivedProjection)
      ? await this.springStatusProjectionRepository.upsert({
          approvedReportCountConsidered: derivedProjection.approvedReportCountConsidered,
          confidence: derivedProjection.confidence,
          derivedFromReportIds: derivedProjection.derivedFromReportIds,
          freshness: derivedProjection.freshness,
          latestApprovedReportAt: derivedProjection.latestApprovedReportAt,
          recalculatedAt: derivedProjection.recalculatedAt,
          springId: derivedProjection.springId,
          waterPresence: derivedProjection.waterPresence,
        })
      : existingProjection!;

    await Promise.all([
      this.queryClient.invalidateQueries({ queryKey: ['public-spring-catalog'] }),
      this.queryClient.invalidateQueries({
        queryKey: ['public-spring-detail', review.review.springId],
      }),
      this.queryClient.invalidateQueries({ queryKey: ['staff-moderation-queue'] }),
      this.queryClient.invalidateQueries({
        queryKey: ['staff-moderation-report-detail', parsed.reportId],
      }),
      this.queryClient.invalidateQueries({
        queryKey: ['staff-moderation-report-media', parsed.reportId],
      }),
    ]);

    return {
      decision: parsed.decision,
      projection,
      reportId: parsed.reportId,
      springId: review.review.springId,
    } satisfies ModerateReportFlowResult;
  }
}
