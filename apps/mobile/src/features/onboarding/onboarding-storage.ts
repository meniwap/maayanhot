import AsyncStorage from '@react-native-async-storage/async-storage';

export const RELEASE_ONBOARDING_STORAGE_KEY = 'maayanhot:release-onboarding:v1';

export const readReleaseOnboardingDismissed = async () => {
  const value = await AsyncStorage.getItem(RELEASE_ONBOARDING_STORAGE_KEY);
  return value === 'dismissed';
};

export const dismissReleaseOnboarding = async () => {
  await AsyncStorage.setItem(RELEASE_ONBOARDING_STORAGE_KEY, 'dismissed');
};
