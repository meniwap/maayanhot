import { AppText, Button, Card, Screen, Stack } from '@maayanhot/ui';
import React from 'react';

type LegalPlaceholderScreenProps = {
  body: string;
  onBack: () => void;
  testID: string;
  title: string;
};

export function LegalPlaceholderScreen({
  body,
  onBack,
  testID,
  title,
}: LegalPlaceholderScreenProps) {
  return (
    <Screen scrollable testID={testID}>
      <Stack gap="4">
        <Button label="חזרה" onPress={onBack} testID={`${testID}-back`} variant="ghost" />
        <Card variant="raised">
          <Stack gap="3">
            <AppText variant="titleLg">{title}</AppText>
            <AppText tone="secondary" variant="bodySm">
              Placeholder release surface בלבד. הטקסט כאן לא מהווה ייעוץ משפטי, לא מהווה נוסח סופי,
              ודורש החלפה במסמך מאושר ומאוחסן לפני הפצת חנויות.
            </AppText>
            <AppText variant="bodyMd">{body}</AppText>
          </Stack>
        </Card>
      </Stack>
    </Screen>
  );
}
