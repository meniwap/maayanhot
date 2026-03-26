import React from 'react';

import { AppText, Button, Card, Inline, Stack, StatusBadge } from '@maayanhot/ui';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import type { SpringSummaryVM } from './spring-summary-vm';
import { formatObservationDate, toStatusBadgeStatus } from '../public-read/public-status';

type SelectedSpringTeaserProps = {
  onDismiss: () => void;
  onOpenDetails: () => void;
  spring: SpringSummaryVM;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function SelectedSpringTeaser({
  onDismiss,
  onOpenDetails,
  spring,
  style,
  testID = 'selected-spring-teaser',
}: SelectedSpringTeaserProps) {
  return (
    <View style={style} testID={testID}>
      <Card variant="raised">
        <Stack gap="3">
          <Inline align="start" justify="between">
            <Stack gap="1" style={{ flex: 1 }}>
              <AppText testID="selected-spring-title" variant="titleLg">
                {spring.title}
              </AppText>
              <AppText tone="secondary" variant="bodySm">
                {spring.regionLabel ?? 'אזור לא מסווג'}
              </AppText>
            </Stack>

            <Button
              label="סגור"
              onPress={onDismiss}
              testID="selected-spring-dismiss"
              variant="ghost"
            />
          </Inline>

          <Inline wrap>
            <StatusBadge status={toStatusBadgeStatus(spring.status.waterState)} />
          </Inline>

          <AppText variant="bodyMd">{spring.status.label}</AppText>
          <AppText tone="secondary" variant="bodySm">
            {formatObservationDate(spring.status.lastApprovedObservationAt)}
          </AppText>

          <Button
            label="לפרטי המעיין"
            onPress={onOpenDetails}
            testID="selected-spring-open-details"
          />
        </Stack>
      </Card>
    </View>
  );
}
