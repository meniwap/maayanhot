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
import {
  SubmitReportFlow,
  type ReportAttachmentDraft,
} from '../../infrastructure/services/submit-report-flow';
import { useOfflineReportQueue } from '../../infrastructure/offline/OfflineReportQueueProvider';

type ReportComposeScreenProps = {
  onBack: () => void;
  onReportSubmitted: (result: {
    feedback: 'report-pending' | 'report-queued-offline';
    springId: string;
  }) => void;
  springId: string | null;
};

type AttachmentViewState = ReportAttachmentDraft;

const readPickerAsset = (asset: ImagePicker.ImagePickerAsset): AttachmentViewState => ({
  byteSize: asset.fileSize ?? null,
  capturedAt: asset.exif?.DateTimeOriginal ?? null,
  height: asset.height ?? null,
  kind: 'image',
  localId: asset.assetId ?? `${asset.uri}-${Date.now()}`,
  localUri: asset.uri,
  mimeType: asset.mimeType ?? null,
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
  const offlineQueue = useOfflineReportQueue();
  const submitReportFlow = useMemo(() => new SubmitReportFlow(offlineQueue), [offlineQueue]);
  const [observedAt, setObservedAt] = useState(new Date().toISOString());
  const [waterPresence, setWaterPresence] = useState<'water' | 'no_water' | 'unknown'>('unknown');
  const [note, setNote] = useState('');
  const [attachments, setAttachments] = useState<AttachmentViewState[]>([]);
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isPreparingAttachment, setIsPreparingAttachment] = useState(false);
  const detailQuery = useQuery({
    enabled: Boolean(snapshot.isConfigured && springId),
    queryFn: () => publicSpringReadRepository.getDetailById(springId!),
    queryKey: ['public-spring-detail', springId],
  });

  const queuedReportsForSpring = offlineQueue.snapshot.items.filter(
    (item) => item.springId === springId && item.ownerUserId === snapshot.userId,
  );

  const submitMutation = useMutation({
    mutationFn: () => {
      return submitReportFlow.submit({
        attachments,
        note,
        observedAt,
        springId: springId!,
        waterPresence,
      });
    },
    onSuccess: (result) => {
      onReportSubmitted({
        feedback: result.feedback,
        springId: springId!,
      });
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

    setIsPreparingAttachment(true);

    try {
      const preparedAttachments = await Promise.all(
        pickerResult.assets.map((asset) =>
          submitReportFlow.prepareAttachment(readPickerAsset(asset)),
        ),
      );

      setAttachments((current) => [...current, ...preparedAttachments]);
    } catch (error) {
      setPermissionMessage(error instanceof Error ? error.message : 'שמירת התמונה המקומית נכשלה.');
    } finally {
      setIsPreparingAttachment(false);
    }
  };

  const handleRemoveAttachment = async (attachment: AttachmentViewState) => {
    await submitReportFlow.discardPreparedAttachment(attachment);
    setAttachments((current) =>
      current.filter((candidate) => candidate.localId !== attachment.localId),
    );
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

  if (snapshot.status !== 'authenticated') {
    return (
      <Screen testID="report-compose-auth-required">
        <Card variant="raised">
          <Stack gap="3">
            <AppText variant="titleLg">נדרש סשן מחובר</AppText>
            <AppText tone="secondary" variant="bodySm">
              הדיווחים ב־Phase 11 נשמרים ומסתנכרנים דרך Supabase אמיתי ולכן מחייבים התחברות דרך סשן
              הפיתוח.
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
          <AppText testID="report-connectivity-state" tone="secondary" variant="bodySm">
            {offlineQueue.snapshot.isOnline
              ? 'יש חיבור. הדיווח יישלח מיד ואם ייכשל זמנית יעבור לתור retry מקומי.'
              : 'אין חיבור. הדיווח יישמר מקומית ויסתנכרן כשאותו משתמש יחזור לאונליין.'}
          </AppText>
          {queuedReportsForSpring.length > 0 ? (
            <AppText testID="report-existing-queue-state" tone="secondary" variant="bodySm">
              יש כרגע {queuedReportsForSpring.length} דיווחים מקומיים בהמתנה לסנכרון עבור המעיין
              הזה.
            </AppText>
          ) : null}
        </Stack>
      </Card>

      <Card>
        <Stack gap="3">
          <TextField
            helperText="ב־Phase 11 שדה הזמן נשמר כטקסט ISO פשוט כדי לשמור על פשטות הסלייס."
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
              onPress={() => attachAsset('camera')}
              testID="report-attach-camera"
              variant="secondary"
            />
            <Button
              label="גלריה"
              onPress={() => attachAsset('library')}
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
                key={attachment.localId}
                onRemove={() => handleRemoveAttachment(attachment)}
                status="ready"
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
          <Button
            disabled={submitMutation.isPending || isPreparingAttachment || attachments.length > 8}
            label={offlineQueue.snapshot.isOnline ? 'שלח דיווח' : 'שמור דיווח מקומית'}
            onPress={handleSubmit}
            stretch
            testID="report-submit"
          />
        </Stack>
      </Card>
    </Screen>
  );
}
