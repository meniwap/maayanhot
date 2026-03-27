import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __DEV__: 'true',
  },
  resolve: {
    alias: {
      '@react-native-async-storage/async-storage': fileURLToPath(
        new URL('./tests/mocks/async-storage.ts', import.meta.url),
      ),
      '@maayanhot/contracts': fileURLToPath(
        new URL('./packages/contracts/src/index.ts', import.meta.url),
      ),
      '@maayanhot/design-tokens': fileURLToPath(
        new URL('./packages/design-tokens/src/index.ts', import.meta.url),
      ),
      '@maayanhot/domain': fileURLToPath(
        new URL('./packages/domain/src/index.ts', import.meta.url),
      ),
      '@maayanhot/map-core': fileURLToPath(
        new URL('./packages/map-core/src/index.ts', import.meta.url),
      ),
      '@maplibre/maplibre-react-native': fileURLToPath(
        new URL('./tests/mocks/maplibre-react-native.ts', import.meta.url),
      ),
      'expo-file-system/legacy': fileURLToPath(
        new URL('./tests/mocks/expo-file-system-legacy.ts', import.meta.url),
      ),
      'expo-image-picker': fileURLToPath(
        new URL('./tests/mocks/expo-image-picker.ts', import.meta.url),
      ),
      'expo-linking': fileURLToPath(new URL('./tests/mocks/expo-linking.ts', import.meta.url)),
      'expo-network': fileURLToPath(new URL('./tests/mocks/expo-network.ts', import.meta.url)),
      'expo-router': fileURLToPath(new URL('./tests/mocks/expo-router.ts', import.meta.url)),
      '@maayanhot/navigation-core': fileURLToPath(
        new URL('./packages/navigation-core/src/index.ts', import.meta.url),
      ),
      '@testing-library/react-native': fileURLToPath(
        new URL('./tests/mocks/testing-library-react-native.ts', import.meta.url),
      ),
      'react-native': fileURLToPath(new URL('./tests/mocks/react-native.ts', import.meta.url)),
      '@maayanhot/shared-utils': fileURLToPath(
        new URL('./packages/shared-utils/src/index.ts', import.meta.url),
      ),
      '@maayanhot/ui': fileURLToPath(new URL('./packages/ui/src/index.ts', import.meta.url)),
      '@maayanhot/upload-core': fileURLToPath(
        new URL('./packages/upload-core/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
