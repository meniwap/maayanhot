import type { NavigationAppOption } from '@maayanhot/navigation-core';
import { AppText, Button, Card, Inline, Screen, Stack, StatusBadge } from '@maayanhot/ui';
import React from 'react';
import { Image, ScrollView, StyleSheet } from 'react-native';

import type { SpringDetailVM } from './spring-detail-vm';
import { formatObservationDate, toStatusBadgeStatus } from '../public-read/public-status';

type SpringDetailViewProps = {
  canSubmitReport?: boolean;
  feedbackMessage?: string | null;
  navigationOptions: NavigationAppOption[];
  onBack: () => void;
  onNavigate: (app: NavigationAppOption['app']) => void;
  onOpenReport?: () => void;
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

export function SpringDetailView({
  canSubmitReport = false,
  feedbackMessage = null,
  navigationOptions,
  onBack,
  onNavigate,
  onOpenReport,
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
