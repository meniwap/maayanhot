import { desertLightTheme, springLightTheme } from '@maayanhot/design-tokens';
import {
  AppText,
  Button,
  Card,
  Chip,
  Inline,
  Screen,
  Stack,
  StatusBadge,
  useTheme,
  useTokens,
} from '@maayanhot/ui';

function ThemeShowcase() {
  const { setTheme, theme } = useTheme();
  const tokens = useTokens();
  const isSpringTheme = theme.id === springLightTheme.id;

  return (
    <Screen scrollable testID="phase-2-showcase">
      <Stack gap="5">
        <Card testID="showcase-hero" variant="raised">
          <Stack gap="4">
            <Inline justify="between" wrap>
              <StatusBadge status="pending" />
              <Chip
                label={isSpringTheme ? 'ערכת צבעים: מעיין' : 'ערכת צבעים: מדבר'}
                variant="status"
              />
            </Inline>

            <Stack gap="2">
              <AppText variant="displayMd">מעיינות ישראל</AppText>
              <AppText tone="secondary" variant="bodyLg">
                בסיס UI מודולרי שמוכיח החלפת נושא עיצובי מרכזית בלי לגעת בקומפוננטות.
              </AppText>
              <AppText tone="muted" variant="bodySm">
                RTL ready / Hebrew first / token driven
              </AppText>
            </Stack>

            <Inline wrap>
              <Button
                label={isSpringTheme ? 'עבור לנושא מדברי' : 'חזור לנושא מעיין'}
                onPress={() => setTheme(isSpringTheme ? desertLightTheme : springLightTheme)}
                variant="secondary"
              />
              <Button label="כפתור ראשי" variant="primary" />
            </Inline>
          </Stack>
        </Card>

        <Card>
          <Stack gap="3">
            <AppText variant="titleLg">טיפוגרפיה וסמנטיקה</AppText>
            <AppText variant="titleMd">כותרת משנית</AppText>
            <AppText variant="bodyMd">
              שורת הסבר רגילה שנשארת נקייה מלוגיקה עסקית ומציגה טקסט בעברית כברירת מחדל.
            </AppText>
            <AppText tone="secondary" variant="bodySm">
              עודכן לאחרונה / Last report pending review
            </AppText>
          </Stack>
        </Card>

        <Card>
          <Stack gap="3">
            <AppText variant="titleLg">פרימיטיבים משותפים</AppText>
            <Inline wrap>
              <Chip label="מסנן" variant="filter" />
              <Chip label="נבחר" variant="selected" />
              <Chip label="תצוגת סטטוס" variant="status" />
            </Inline>

            <Inline wrap>
              <StatusBadge status="water" />
              <StatusBadge status="noWater" />
              <StatusBadge status="unknown" />
              <StatusBadge status="stale" />
              <StatusBadge status="pending" />
            </Inline>
          </Stack>
        </Card>

        <Card>
          <Stack gap="3">
            <AppText variant="titleLg">כפתורים</AppText>
            <Button label="ראשי" stretch variant="primary" />
            <Button label="משני" stretch variant="secondary" />
            <Button label="רוחב חופשי" stretch variant="ghost" />
            <Button label="פעולה רגישה" stretch variant="danger" />
            <Button disabled label="מושבת" stretch variant="secondary" />
          </Stack>
        </Card>

        <Card>
          <Stack gap="3">
            <AppText variant="titleLg">סקייל ריווח</AppText>
            <Inline justify="between">
              <AppText variant="bodySm">space.4 = {tokens.space['4']}</AppText>
              <AppText variant="bodySm">radius.lg = {tokens.radius.lg}</AppText>
            </Inline>
            <Inline justify="between">
              <AppText variant="bodySm">icon.lg = {tokens.icon.lg}</AppText>
              <AppText variant="bodySm">theme = {theme.name}</AppText>
            </Inline>
          </Stack>
        </Card>
      </Stack>
    </Screen>
  );
}

export default function FoundationScreen() {
  return <ThemeShowcase />;
}
