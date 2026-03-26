import { springLightTheme } from '@maayanhot/design-tokens';
import { ThemeProvider } from '@maayanhot/ui';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import HeeboVariable from '../assets/fonts/Heebo-Variable.ttf';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Heebo: HeeboVariable,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider direction="rtl" initialTheme={springLightTheme}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
