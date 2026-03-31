import { AppText, Button, Card, Screen, Stack } from '@maayanhot/ui';
import React from 'react';

type AboutScreenProps = {
  onBack: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
};

export function AboutScreen({ onBack, onOpenPrivacy, onOpenTerms }: AboutScreenProps) {
  return (
    <Screen scrollable testID="about-screen">
      <Stack gap="4">
        <Button label="חזרה" onPress={onBack} testID="about-back" variant="ghost" />

        <Card variant="raised">
          <Stack gap="3">
            <AppText variant="titleLg">מידע על הבטא</AppText>
            <AppText tone="secondary" variant="bodySm">
              האפליקציה נמצאת כרגע במוכנות בטא פנימית עבור iOS ו־Android. הקריאה הציבורית נשענת על
              משטחי קריאה בטוחים לציבור, ודיווחים חדשים משפיעים על הסטטוס הציבורי רק אחרי אישור
              מודרציה.
            </AppText>
            <AppText tone="secondary" variant="bodySm">
              עבודה ללא חיבור נשמרת בגבולות Phase 11 בלבד: נתונים ציבוריים שכבר נטענו ודיווחים
              ממתינים לסנכרון תחת אותו משתמש. ניווט למסלול נשאר handoff לאפליקציות חיצוניות.
            </AppText>
            <AppText tone="secondary" variant="bodySm">
              קישור העומק הציבורי הנתמך בבטא הוא `springs-israel://springs/:springId` בלבד. קישורי
              internal, universal links ו־App Links עדיין לא חלק מהבטא.
            </AppText>
          </Stack>
        </Card>

        <Card>
          <Stack gap="3">
            <AppText variant="titleMd">פרטיות ומשפטי</AppText>
            <AppText tone="secondary" variant="bodySm">
              אלו משטחי placeholder בלבד לצורכי מוכנות הפצה. לפני הגשת חנויות נדרש ניסוח סופי ובדיקה
              משפטית אמיתית.
            </AppText>
            <Button
              label="מדיניות פרטיות placeholder"
              onPress={onOpenPrivacy}
              testID="about-open-privacy"
              variant="secondary"
            />
            <Button
              label="תנאי שימוש placeholder"
              onPress={onOpenTerms}
              testID="about-open-terms"
              variant="secondary"
            />
          </Stack>
        </Card>
      </Stack>
    </Screen>
  );
}
