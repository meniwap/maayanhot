import type { NavigationAppOption } from '@maayanhot/navigation-core';
import { AppText, Button, Card, Inline, Screen, Stack, StatusBadge } from '@maayanhot/ui';
import React from 'react';
import { Image, ScrollView, StyleSheet } from 'react-native';

import type { SpringDetailVM } from './spring-detail-vm';
import type {
  OfflineReportDeliveryReceipt,
  QueuedReportSubmission,
} from '../../infrastructure/offline/offline-report-queue';
import { formatObservationDate, toStatusBadgeStatus } from '../public-read/public-status';

type SpringDetailViewProps = {
  canSubmitReport?: boolean;
  feedbackMessage?: string | null;
  isRenderingCachedData?: boolean;
  localQueuedReports?: QueuedReportSubmission[];
  localRecentDeliveries?: OfflineReportDeliveryReceipt[];
  navigationOptions: NavigationAppOption[];
  onBack: () => void;
  onDiscardQueuedReport?: (queueId: string) => void;
  onNavigate: (app: NavigationAppOption['app']) => void;
  onOpenReport?: () => void;
  onRetryQueuedReport?: (queueId: string) => void;
  spring: SpringDetailVM;
};

const styles = StyleSheet.create({
  galleryImage: {
    aspectRatio: 4 / 3,
    borderRadius: 18,
    minWidth: 224,
    width: 224,
  },
  historyMetaRow: {
    width: '100%',
  },
});

const formatQueuedReportFailureMessage = (item: QueuedReportSubmission) => {
  if (item.attachments.some((attachment) => attachment.deliveryState === 'finalize_pending')) {
    return 'הקובץ כבר הועלה, והמערכת מנסה להשלים את המטא-דאטה שלו מול השרת.';
  }

  switch (item.lastErrorCode) {
    case 'asset_fetch_failed':
      return 'קובץ התמונה המקומי כבר לא זמין במכשיר, ולכן צריך לבחור אותו מחדש.';
    case 'file_too_large':
      return 'הקובץ חורג ממגבלת הגודל המותרת להעלאה.';
    case 'file_too_large_after_processing':
      return 'גם אחרי הקטנה ודחיסה חד-פעמית, הקובץ עדיין גדול מדי להעלאה.';
    case 'image_dimensions_exceed_limit':
      return 'מימדי התמונה עדיין חורגים מהמגבלה הנתמכת.';
    case 'mime_type_not_allowed':
      return 'סוג הקובץ אינו נתמך במסלול ההעלאה המאושר.';
    case 'upload_failed':
      return 'ההעלאה נכשלה זמנית, והמערכת תנסה שוב בהתאם למדיניות ה-retry.';
    default:
      return 'הדיווח לא נשלח בגלל שגיאה שאינה ניתנת ל-retry אוטומטי.';
  }
};

export function SpringDetailView({
  canSubmitReport = false,
  feedbackMessage = null,
  isRenderingCachedData = false,
  localQueuedReports = [],
  localRecentDeliveries = [],
  navigationOptions,
  onBack,
  onDiscardQueuedReport,
  onNavigate,
  onOpenReport,
  onRetryQueuedReport,
  spring,
}: SpringDetailViewProps) {
  return (
    <Screen scrollable testID="spring-detail-screen">
      <Inline justify="between">
        <Button label="חזרה למפה" onPress={onBack} testID="spring-detail-back" variant="ghost" />
      </Inline>

      {feedbackMessage ? (
        <Card testID="spring-detail-feedback" variant="raised">
          <AppText variant="bodyMd">{feedbackMessage}</AppText>
        </Card>
      ) : null}

      {isRenderingCachedData ? (
        <Card testID="spring-detail-offline-cache" variant="raised">
          <AppText tone="secondary" variant="bodySm">
            מוצגים כרגע נתונים ציבוריים ששוחזרו מהמטמון המקומי. סטטוס ציבורי נשאר תלוי רק בנתונים
            המאושרים שבשרת.
          </AppText>
        </Card>
      ) : null}

      {localRecentDeliveries.length > 0 || localQueuedReports.length > 0 ? (
        <Card testID="spring-detail-local-delivery">
          <Stack gap="3">
            <AppText variant="titleMd">מצב דיווחים מקומיים במכשיר</AppText>

            {localRecentDeliveries.map((delivery) => (
              <Card
                key={`delivery-${delivery.queueId}`}
                padding="3"
                testID={`spring-local-delivery-${delivery.queueId}`}
              >
                <Stack gap="1">
                  <AppText variant="labelMd">נשלח וממתין למודרציה</AppText>
                  <AppText tone="secondary" variant="bodySm">
                    הדיווח נשלח לשרת ונשמר בהמתנה לאישור. הוא עדיין לא חלק מהתצוגה הציבורית.
                  </AppText>
                </Stack>
              </Card>
            ))}

            {localQueuedReports.map((item) => (
              <Card key={item.queueId} padding="3" testID={`spring-local-queue-${item.queueId}`}>
                <Stack gap="2">
                  <AppText variant="labelMd">
                    {item.status === 'queued'
                      ? 'דיווח שמור מקומית'
                      : item.status === 'retry_scheduled'
                        ? 'הדיווח מחכה לניסיון חוזר'
                        : item.status === 'syncing'
                          ? 'הדיווח נשלח כעת'
                          : item.status === 'blocked_auth'
                            ? 'הדיווח מחכה להתחברות של אותו משתמש'
                            : 'הדיווח נעצר ודורש טיפול'}
                  </AppText>
                  <AppText tone="secondary" variant="bodySm">
                    {item.status === 'failed_permanent'
                      ? formatQueuedReportFailureMessage(item)
                      : item.status === 'retry_scheduled'
                        ? item.attachments.some(
                            (attachment) => attachment.deliveryState === 'finalize_pending',
                          )
                          ? 'המטא-דאטה של הקובץ כבר ממתינה להשלמה מול השרת בניסיון החוזר הבא.'
                          : `הניסיון הבא יקרה לאחר ${item.nextAttemptAt?.slice(11, 16) ?? 'התאוששות חיבור'}.`
                        : item.status === 'blocked_auth'
                          ? 'יש להתחבר מחדש עם אותו משתמש כדי להשלים את השליחה.'
                          : 'הדיווח נשמר רק מקומית עד לסיום מסלול השליחה והאישור.'}
                  </AppText>
                  {item.lastErrorCode ? (
                    <AppText tone="secondary" variant="bodySm">
                      קוד שגיאה אחרון: {item.lastErrorCode}
                    </AppText>
                  ) : null}
                  {item.status !== 'syncing' ? (
                    <Inline gap="2">
                      {onRetryQueuedReport ? (
                        <Button
                          label="נסה שוב"
                          onPress={() => onRetryQueuedReport(item.queueId)}
                          testID={`spring-local-queue-retry-${item.queueId}`}
                          variant="secondary"
                        />
                      ) : null}
                      {onDiscardQueuedReport ? (
                        <Button
                          label="מחק טיוטה מקומית"
                          onPress={() => onDiscardQueuedReport(item.queueId)}
                          testID={`spring-local-queue-discard-${item.queueId}`}
                          variant="ghost"
                        />
                      ) : null}
                    </Inline>
                  ) : null}
                </Stack>
              </Card>
            ))}
          </Stack>
        </Card>
      ) : null}

      <Card variant="raised">
        <Stack gap="3">
          <Stack gap="1">
            <AppText testID="spring-detail-title" variant="displayMd">
              {spring.title}
            </AppText>
            {spring.alternateNames.length > 0 ? (
              <AppText tone="secondary" variant="bodySm">
                {spring.alternateNames.join(' / ')}
              </AppText>
            ) : null}
            <AppText tone="secondary" variant="bodySm">
              {spring.locationLabel ?? spring.regionLabel ?? 'מיקום ציבורי ללא תיאור נוסף'}
            </AppText>
          </Stack>

          <Inline wrap>
            <StatusBadge
              status={toStatusBadgeStatus(spring.status.waterState)}
              testID="spring-detail-status-badge"
            />
          </Inline>

          <Stack gap="1">
            <AppText testID="spring-detail-status-label" variant="titleMd">
              {spring.status.label}
            </AppText>
            <AppText tone="secondary" variant="bodySm">
              {formatObservationDate(spring.status.lastApprovedObservationAt)}
            </AppText>
            <AppText tone="secondary" variant="bodySm">
              {spring.status.confidenceLabel} · {spring.status.freshnessLabel} ·{' '}
              {spring.status.approvedHistoryCount} תצפיות מאושרות בתמצית
            </AppText>
          </Stack>
        </Stack>
      </Card>

      <Card>
        <Stack gap="2">
          <AppText variant="titleMd">תיאור ציבורי</AppText>
          {spring.description ? <AppText variant="bodyMd">{spring.description}</AppText> : null}
          {spring.accessNotes ? (
            <AppText tone="secondary" variant="bodySm">
              גישה: {spring.accessNotes}
            </AppText>
          ) : (
            <AppText tone="secondary" variant="bodySm">
              עדיין אין הערות גישה ציבוריות להצגה.
            </AppText>
          )}
        </Stack>
      </Card>

      <Card testID="spring-detail-gallery">
        <Stack gap="3">
          <AppText variant="titleMd">גלריית תמונות מאושרות</AppText>

          {spring.gallery.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Inline gap="3">
                {spring.gallery.map((image) => (
                  <Stack gap="1" key={image.id}>
                    <Image
                      source={{ uri: image.url }}
                      style={styles.galleryImage}
                      testID={`spring-gallery-image-${image.id}`}
                    />
                    <AppText tone="secondary" variant="bodySm">
                      {image.alt ?? 'תמונה ציבורית מאושרת'}
                    </AppText>
                  </Stack>
                ))}
              </Inline>
            </ScrollView>
          ) : (
            <AppText tone="secondary" variant="bodySm">
              עדיין אין תמונות מאושרות להצגה פומבית.
            </AppText>
          )}
        </Stack>
      </Card>

      <Card testID="spring-detail-history-summary">
        <Stack gap="3">
          <AppText variant="titleMd">תמצית דיווחים מאושרים</AppText>

          {spring.historySummary.length > 0 ? (
            spring.historySummary.map((entry) => (
              <Card
                key={entry.reportId}
                padding="3"
                testID={`history-summary-item-${entry.reportId}`}
              >
                <Stack gap="2">
                  <Inline justify="between" style={styles.historyMetaRow}>
                    <AppText variant="labelMd">{entry.label}</AppText>
                    <StatusBadge status={toStatusBadgeStatus(entry.waterState)} />
                  </Inline>
                  <AppText tone="secondary" variant="bodySm">
                    תצפית מאושרת מתאריך {entry.observedAt.slice(0, 10)}
                  </AppText>
                </Stack>
              </Card>
            ))
          ) : (
            <AppText tone="secondary" variant="bodySm">
              עדיין אין תמצית דיווחים מאושרים להצגה.
            </AppText>
          )}
        </Stack>
      </Card>

      {canSubmitReport && onOpenReport ? (
        <Card testID="spring-detail-report-entry">
          <Stack gap="3">
            <AppText variant="titleMd">דיווח מהשטח</AppText>
            <AppText tone="secondary" variant="bodySm">
              דיווח חדש נשמר בהמתנה לאישור ואינו משנה את התצוגה הציבורית מיד.
            </AppText>
            <Button
              label="דווח על מצב המעיין"
              onPress={onOpenReport}
              stretch
              testID="spring-detail-open-report"
            />
          </Stack>
        </Card>
      ) : null}

      <Card testID="spring-detail-navigation">
        <Stack gap="3">
          <AppText variant="titleMd">ניווט חיצוני</AppText>
          <AppText tone="secondary" variant="bodySm">
            פתיחה חיצונית בלבד. המסך הזה לא מחשב מסלול פנימי.
          </AppText>

          <Stack gap="2">
            {navigationOptions.map((option) => (
              <Button
                key={option.app}
                label={`פתח ב-${option.label}`}
                onPress={() => onNavigate(option.app)}
                stretch
                testID={`navigate-${option.app}`}
                variant={option.app === 'google_maps' ? 'primary' : 'secondary'}
              />
            ))}
          </Stack>
        </Stack>
      </Card>
    </Screen>
  );
}
