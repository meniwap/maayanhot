import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { useTheme, useTokens } from '../theme-context';
import { AppText } from './AppText';

export type TextFieldProps = {
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  errorText?: string | null;
  helperText?: string | null;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  label: string;
  multiline?: boolean;
  onBlur?: () => void;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  testID?: string;
  value: string;
};

export function TextField({
  autoCapitalize = 'sentences',
  errorText = null,
  helperText = null,
  keyboardType = 'default',
  label,
  multiline = false,
  onBlur,
  onChangeText,
  placeholder,
  testID,
  value,
}: TextFieldProps) {
  const tokens = useTokens();
  const { resolveTextAlign, theme } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: tokens.space['2'] }} testID={testID}>
      <AppText variant="labelMd">{label}</AppText>
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        placeholderTextColor={tokens.text.muted}
        style={{
          backgroundColor: tokens.bg.surfaceRaised,
          borderColor: errorText
            ? tokens.feedback.error
            : focused
              ? tokens.action.primary.border
              : tokens.border.default,
          borderRadius: tokens.radius.md,
          borderWidth: 1,
          color: tokens.text.primary,
          fontFamily: theme.typography.fontFamily.body,
          fontSize: theme.typography.scale.bodyMd.fontSize,
          lineHeight: theme.typography.scale.bodyMd.lineHeight,
          minHeight: multiline ? 112 : 52,
          paddingHorizontal: tokens.space['4'],
          paddingVertical: tokens.space['3'],
          textAlign: resolveTextAlign('start'),
          textAlignVertical: multiline ? 'top' : 'center',
        }}
        testID={testID ? `${testID}-input` : undefined}
        value={value}
      />
      {errorText ? (
        <AppText
          {...(testID ? { testID: `${testID}-error` } : {})}
          tone="secondary"
          variant="bodySm"
        >
          {errorText}
        </AppText>
      ) : helperText ? (
        <AppText
          {...(testID ? { testID: `${testID}-helper` } : {})}
          tone="secondary"
          variant="bodySm"
        >
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
}
