import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AppText,
  Button,
  Card,
  Inline,
  PhotoTile,
  Screen,
  Stack,
  TextAreaField,
  TextField,
} from '@maayanhot/ui';
import React, { useMemo, useState } from 'react';

import { useDevSession } from '../dev-session/DevSessionProvider';
import { publicSpringReadRepository } from '../../infrastructure/supabase/repositories/public-spring-read-repository';
import { springReportRepository } from '../../infrastructure/supabase/repositories/spring-report-repository';
import {
  SubmitReportFlow,
  type ReportAttachmentDraft,
} from '../../infrastructure/services/submit-report-flow';
import { createSupabaseUploadAdapter, type PendingUpload } from '@maayanhot/upload-core';
import { getSupabaseClient } from '../../infrastructure/supabase/client';

type ReportComposeScreenProps = {
  onBack: () => void;
  onReportSubmitted: (springId: string) => void;
  springId: string | null;
};

type AttachmentViewState = ReportAttachmentDraft & {
  errorCode: string | null;
  pendingUpload: PendingUpload | null;
  status: 'failed' | 'ready' | 'uploading';
};

const readPickerAsset = (asset: ImagePicker.ImagePickerAsset): AttachmentViewState => ({
  byteSize: asset.fileSize ?? null,
  capturedAt: asset.exif?.DateTimeOriginal ?? null,
  errorCode: null,
  height: asset.height ?? null,
  kind: 'image',
  localId: asset.assetId ?? `${asset.uri}-${Date.now()}`,
  localUri: asset.uri,
  mimeType: asset.mimeType ?? null,
  pendingUpload: null,
  status: 'ready',
  width: asset.width ?? null,
});

const waterStateOptions = [
  { label: 'יש מים', value: 'water' as const },
  { label: 'אין מים', value: 'no_water' as const },
  { label: 'לא בטוח', value: 'unknown' as const },
];

export function ReportComposeScreen({
  onBack,
  onReportSubmitted,
  springId,
}: ReportComposeScreenProps) {
  const { snapshot } = useDevSession();
  const submitReportFlow = useMemo(
    () =>
      snapshot.isConfigured
        ? new SubmitReportFlow(
            springReportRepository,
            createSupabaseUploadAdapter(getSupabaseClient()),
          )
        : null,
    [snapshot.isConfigured],
  );
  const [observedAt, setObservedAt] = useState(new Date().toISOString());
  const [waterPresence, setWaterPresence] = useState<'water' | 'no_water' | 'unknown'>('unknown');
  const [note, setNote] = useState('');
  const [attachments, setAttachments] = useState<AttachmentViewState[]>([]);
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [createdReportId, setCreatedReportId] = useState<string | null>(null);
  const detailQuery = useQuery({
    enabled: Boolean(snapshot.isConfigured && springId),
    queryFn: () => publicSpringReadRepository.getDetailById(springId!),
    queryKey: ['public-spring-detail', springId],
  });

  const failedAttachments = useMemo(
    () => attachments.filter((attachment) => attachment.status === 'failed'),
    [attachments],
  );

  const submitMutation = useMutation({
    mutationFn: () => {
      if (!submitReportFlow) {
        throw new Error('Supabase upload flow is not configured.');
      }

      return submitReportFlow.submit({
        attachments,
        note,
        observedAt,
        springId: springId!,
        waterPresence,
      });
    },
    onSuccess: (result) => {
      setCreatedReportId(result.reportId);

      if (result.failedUploads.length === 0) {
        onReportSubmitted(springId!);
        return;
      }

      setSubmitMessage('הדיווח נשמר, אבל חלק מהתמונות נכשלו בהעלאה. אפשר לנסות שוב מהכרטיסים.');
      setAttachments((current) =>
        current.map((attachment) => {
          const failedUpload = result.failedUploads.find(
            (candidate) => candidate.queueId === attachment.localId,
          );

          if (!failedUpload) {
            return attachment;
          }

          return {
            ...attachment,
            errorCode: failedUpload.lastErrorCode,
            pendingUpload: failedUpload,
            status: 'failed',
          };
        }),
      );
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (localId: string) => {
      const attachment = attachments.find((candidate) => candidate.localId === localId);

      if (!attachment || !createdReportId) {
        throw new Error('Missing failed upload state.');
      }

      if (!submitReportFlow || !attachment.pendingUpload) {
        throw new Error('Missing retry metadata for the failed upload.');
      }

      return submitReportFlow.retryUpload(attachment.pendingUpload);
    },
    onError: (error) => {
      setSubmitMessage(error instanceof Error ? error.message : 'הניסיון החוזר נכשל.');
    },
  });

  const attachAsset = async (source: 'camera' | 'library') => {
    setPermissionMessage(null);

    const permissionResult =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.status !== 'granted') {
      setPermissionMessage(source === 'camera' ? 'הרשאת מצלמה נדחתה.' : 'הרשאת גלריה נדחתה.');
      return;
    }

    const pickerResult =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            mediaTypes: ['images'],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: false,
            mediaTypes: ['images'],
            quality: 0.8,
            selectionLimit: 1,
          });

    if (pickerResult.canceled) {
      return;
    }

    setAttachments((current) => [...current, ...pickerResult.assets.map(readPickerAsset)]);
  };

  const handleSubmit = async () => {
    setValidationMessage(null);
    setSubmitMessage(null);

    if (!springId) {
      setValidationMessage('אי אפשר לשלוח דיווח בלי מזהה מעיין.');
      return;
    }

    if (!observedAt.trim()) {
      setValidationMessage('יש להזין זמן תצפית.');
      return;
    }

    try {
      await submitMutation.mutateAsync();
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : 'שליחת הדיווח נכשלה.');
    }
  };

  const handleRetry = async (localId: string) => {
    const attachment = attachments.find((candidate) => candidate.localId === localId);

    if (!attachment) {
      return;
    }

    setAttachments((current) =>
      current.map((candidate) =>
        candidate.localId === localId
          ? { ...candidate, errorCode: null, status: 'uploading' }
          : candidate,
      ),
    );

    try {
      await retryMutation.mutateAsync(localId);
      const nextAttachments = attachments.map((candidate) =>
        candidate.localId === localId
          ? { ...candidate, errorCode: null, pendingUpload: null, status: 'ready' as const }
          : candidate,
      );

      setAttachments(nextAttachments);

      if (nextAttachments.every((candidate) => candidate.status !== 'failed')) {
        onReportSubmitted(springId!);
      }
    } catch (error) {
      setAttachments((current) =>
        current.map((candidate) =>
          candidate.localId === localId
            ? {
                ...candidate,
                errorCode: error instanceof Error ? error.message : 'upload_failed',
                status: 'failed',
              }
            : candidate,
        ),
      );
    }
  };

  if (snapshot.status !== 'authenticated') {
    return (
      <Screen testID="report-compose-auth-required">
        <Card variant="raised">
          <Stack gap="3">
            <AppText variant="titleLg">נדרש סשן מחובר</AppText>
            <AppText tone="secondary" variant="bodySm">
              הדיווחים ב־Phase 8 נשלחים דרך Supabase אמיתי ולכן מחייבים התחברות דרך סשן הפיתוח.
            </AppText>
            <Button label="חזרה" onPress={onBack} variant="ghost" />
          </Stack>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scrollable testID="report-compose-screen">
      <Inline justify="between">
        <Button label="חזרה" onPress={onBack} variant="ghost" />
      </Inline>

      <Card variant="raised">
        <Stack gap="2">
          <AppText variant="titleLg">דיווח חדש מהשטח</AppText>
          <AppText tone="secondary" variant="bodySm">
            {detailQuery.data
              ? `המעיין: ${detailQuery.data.title}`
              : 'טוען את פרטי המעיין הציבוריים...'}
          </AppText>
        </Stack>
      </Card>

      <Card>
        <Stack gap="3">
          <TextField
            helperText="ב־Phase 8 שדה הזמן נשמר כטקסט ISO פשוט כדי לשמור על פשטות הסלייס."
            label="זמן תצפית"
            onChangeText={setObservedAt}
            testID="report-observed-at"
            value={observedAt}
          />
          <Stack gap="2">
            <AppText variant="labelMd">מצב מים</AppText>
            <Inline gap="2">
              {waterStateOptions.map((option) => (
                <Button
                  key={option.value}
                  label={option.label}
                  onPress={() => setWaterPresence(option.value)}
                  testID={`report-water-state-${option.value}`}
                  variant={waterPresence === option.value ? 'primary' : 'secondary'}
                />
              ))}
            </Inline>
          </Stack>
          <TextAreaField label="הערה" onChangeText={setNote} testID="report-note" value={note} />
        </Stack>
      </Card>

      <Card testID="report-photo-section">
        <Stack gap="3">
          <AppText variant="titleMd">צירוף תמונות</AppText>
          <Inline gap="2">
            <Button
              label="מצלמה"
              onPress={() => void attachAsset('camera')}
              testID="report-attach-camera"
              variant="secondary"
            />
            <Button
              label="גלריה"
              onPress={() => void attachAsset('library')}
              testID="report-attach-library"
              variant="secondary"
            />
          </Inline>
          {permissionMessage ? (
            <AppText testID="report-permission-message" tone="secondary" variant="bodySm">
              {permissionMessage}
            </AppText>
          ) : null}
          {attachments.length === 0 ? (
            <AppText tone="secondary" variant="bodySm">
              עדיין לא נבחרו תמונות.
            </AppText>
          ) : (
            attachments.map((attachment) => (
              <PhotoTile
                caption={attachment.errorCode ? `קוד שגיאה: ${attachment.errorCode}` : null}
                key={attachment.localId}
                {...(!createdReportId
                  ? {
                      onRemove: () =>
                        setAttachments((current) =>
                          current.filter((candidate) => candidate.localId !== attachment.localId),
                        ),
                    }
                  : {})}
                {...(attachment.status === 'failed'
                  ? {
                      onRetry: () => void handleRetry(attachment.localId),
                    }
                  : {})}
                status={attachment.status}
                testID={`photo-tile-${attachment.localId}`}
                uri={attachment.localUri}
              />
            ))
          )}
        </Stack>
      </Card>

      <Card>
        <Stack gap="3">
          {validationMessage ? (
            <AppText testID="report-validation-message" tone="secondary" variant="bodySm">
              {validationMessage}
            </AppText>
          ) : null}
          {submitMessage ? (
            <AppText testID="report-submit-message" tone="secondary" variant="bodySm">
              {submitMessage}
            </AppText>
          ) : null}
          {failedAttachments.length > 0 ? (
            <AppText testID="report-retry-state" tone="secondary" variant="bodySm">
              נשארו {failedAttachments.length} קבצים לכשל חוזר. לחצו "נסה שוב" על כל כרטיס כושל.
            </AppText>
          ) : null}
          <Button
            disabled={submitMutation.isPending || failedAttachments.length > 0 || !submitReportFlow}
            label="שלח דיווח"
            onPress={() => void handleSubmit()}
            stretch
            testID="report-submit"
          />
        </Stack>
      </Card>
    </Screen>
  );
}
