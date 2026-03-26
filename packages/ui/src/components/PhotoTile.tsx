import { Pressable, View, Image } from 'react-native';

import { useTokens } from '../theme-context';
import { AppText } from './AppText';
import { Inline } from './Inline';
import { Stack } from './Stack';

export type PhotoTileProps = {
  caption?: string | null;
  onRemove?: () => void;
  onRetry?: () => void;
  status?: 'ready' | 'uploading' | 'failed';
  testID?: string;
  uri: string;
};

export function PhotoTile({
  caption = null,
  onRemove,
  onRetry,
  status = 'ready',
  testID,
  uri,
}: PhotoTileProps) {
  const tokens = useTokens();

  return (
    <Stack
      gap="2"
      style={{
        backgroundColor: tokens.bg.surfaceRaised,
        borderColor: status === 'failed' ? tokens.feedback.error : tokens.border.subtle,
        borderRadius: tokens.radius.lg,
        borderWidth: 1,
        padding: tokens.space['3'],
      }}
      {...(testID ? { testID } : {})}
    >
      <Image
        source={{ uri }}
        style={{
          aspectRatio: 4 / 3,
          borderRadius: tokens.radius.md,
          width: '100%',
        }}
        testID={testID ? `${testID}-image` : undefined}
      />
      <Stack gap="1">
        <AppText variant="labelMd">
          {status === 'failed'
            ? 'העלאה נכשלה'
            : status === 'uploading'
              ? 'מעלה תמונה'
              : 'מוכן לצירוף'}
        </AppText>
        {caption ? (
          <AppText tone="secondary" variant="bodySm">
            {caption}
          </AppText>
        ) : null}
      </Stack>
      <Inline gap="2">
        {status === 'failed' && onRetry ? (
          <Pressable onPress={onRetry} testID={testID ? `${testID}-retry` : undefined}>
            <View>
              <AppText tone="link" variant="labelMd">
                נסה שוב
              </AppText>
            </View>
          </Pressable>
        ) : null}
        {onRemove ? (
          <Pressable onPress={onRemove} testID={testID ? `${testID}-remove` : undefined}>
            <View>
              <AppText tone="secondary" variant="labelMd">
                הסר
              </AppText>
            </View>
          </Pressable>
        ) : null}
      </Inline>
    </Stack>
  );
}
