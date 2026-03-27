import { AppText, Button, Card, Inline, Stack, StatusBadge } from '@maayanhot/ui';
import React from 'react';

import type { SpringSummaryVM } from './spring-summary-vm';
import { formatObservationDate, toStatusBadgeStatus } from '../public-read/public-status';

type SpringDiscoveryListProps = {
  onOpenDetails: (springId: string) => void;
  onShowOnMap: (springId: string) => void;
  selectedSpringId: string | null;
  springs: SpringSummaryVM[];
};

export function SpringDiscoveryList({
  onOpenDetails,
  onShowOnMap,
  selectedSpringId,
  springs,
}: SpringDiscoveryListProps) {
  return (
    <Stack gap="3" testID="discovery-list">
      {springs.map((spring) => {
        const isSelected = spring.id === selectedSpringId;

        return (
          <Card
            key={spring.id}
            style={isSelected ? { borderWidth: 2 } : undefined}
            testID={`discovery-list-item-${spring.id}`}
            variant="raised"
          >
            <Stack gap="3">
              <Stack gap="1">
                <AppText variant="titleMd">{spring.title}</AppText>
                <AppText tone="secondary" variant="bodySm">
                  {spring.regionLabel ?? 'אזור לא מסווג'}
                </AppText>
              </Stack>

              <Inline gap="2" wrap>
                <StatusBadge status={toStatusBadgeStatus(spring.status.waterState)} />
              </Inline>

              <AppText variant="bodyMd">{spring.status.label}</AppText>
              <AppText tone="secondary" variant="bodySm">
                {formatObservationDate(spring.status.lastApprovedObservationAt)}
              </AppText>

              <Inline gap="2">
                <Button
                  label="הצג במפה"
                  onPress={() => onShowOnMap(spring.id)}
                  testID={`discovery-list-show-map-${spring.id}`}
                  variant={isSelected ? 'primary' : 'secondary'}
                />
                <Button
                  label="לפרטי המעיין"
                  onPress={() => onOpenDetails(spring.id)}
                  testID={`discovery-list-open-details-${spring.id}`}
                />
              </Inline>
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}

type DiscoveryEmptyStateProps = {
  onReset: () => void;
  showReset: boolean;
};

export function DiscoveryEmptyState({ onReset, showReset }: DiscoveryEmptyStateProps) {
  return (
    <Card testID="discovery-empty-state" variant="raised">
      <Stack gap="3">
        <AppText variant="titleMd">לא נמצאו מעיינות תואמים</AppText>
        <AppText tone="secondary" variant="bodySm">
          אפשר לשנות חיפוש, להרחיב את הסינון, או לנקות את כל ההגבלות כדי לחזור לקטלוג המלא.
        </AppText>
        {showReset ? (
          <Button label="נקה חיפוש וסינון" onPress={onReset} testID="discovery-empty-reset" />
        ) : null}
      </Stack>
    </Card>
  );
}
