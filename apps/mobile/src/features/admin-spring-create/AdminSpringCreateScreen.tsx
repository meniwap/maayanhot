import {
  mapLibreAdapter,
  type CoordinatePickerChange,
  type MapSurfacePalette,
} from '@maayanhot/map-core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateSpringSlugFromTitle } from '@maayanhot/domain';
import { CreateSpringFlow } from '@maayanhot/use-cases';
import {
  AppText,
  Button,
  Card,
  Inline,
  Screen,
  Stack,
  TextAreaField,
  TextField,
  useTokens,
} from '@maayanhot/ui';
import React, { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { useDevSession } from '../dev-session/DevSessionProvider';
import { useOfflineReportQueue } from '../../infrastructure/offline/OfflineReportQueueProvider';
import { initialIsraelViewport } from '../map-browse/public-spring-catalog';
import { springRepository } from '../../infrastructure/supabase/repositories/spring-repository';

type AdminSpringCreateScreenProps = {
  onBack: () => void;
  onOpenPublishedSpring: (springId: string) => void;
};

const createSpringFlow = new CreateSpringFlow(springRepository);

const defaultLatitude = initialIsraelViewport.center?.latitude ?? 31.4117;
const defaultLongitude = initialIsraelViewport.center?.longitude ?? 35.0818;

export function AdminSpringCreateScreen({
  onBack,
  onOpenPublishedSpring,
}: AdminSpringCreateScreenProps) {
  const tokens = useTokens();
  const queryClient = useQueryClient();
  const { snapshot } = useDevSession();
  const offlineQueue = useOfflineReportQueue();
  const CoordinatePickerSurface = mapLibreAdapter.CoordinatePickerSurface;
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [alternateNamesText, setAlternateNamesText] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [accessNotes, setAccessNotes] = useState('');
  const [description, setDescription] = useState('');
  const [latitudeText, setLatitudeText] = useState(String(defaultLatitude));
  const [longitudeText, setLongitudeText] = useState(String(defaultLongitude));
  const [publicationState, setPublicationState] = useState<'draft' | 'published'>('draft');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [draftSuccess, setDraftSuccess] = useState<{
    slug: string;
    title: string;
  } | null>(null);
  const slugTouchedRef = useRef(false);
  const slugRequestIdRef = useRef(0);

  const selectedCoordinate = useMemo(() => {
    const latitude = Number(latitudeText);
    const longitude = Number(longitudeText);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      latitude,
      longitude,
    };
  }, [latitudeText, longitudeText]);

  const requestSuggestedSlug = (value: string) => {
    const requestId = slugRequestIdRef.current + 1;

    slugRequestIdRef.current = requestId;
    setSlug(generateSpringSlugFromTitle(value));

    void createSpringFlow.resolveSuggestedSlug(value).then((resolvedSlug) => {
      if (slugRequestIdRef.current === requestId && !slugTouchedRef.current) {
        setSlug(resolvedSlug);
      }
    });
  };

  const createMutation = useMutation({
    mutationFn: (input: {
      slug: string;
      title: string;
      alternateNames: string[];
      latitude: number;
      longitude: number;
      accessNotes: string | null;
      description: string | null;
      isPublished: boolean;
      regionCode: string | null;
    }) =>
      createSpringFlow.submit({
        accessNotes: input.accessNotes,
        alternateNames: input.alternateNames,
        description: input.description,
        isPublished: input.isPublished,
        location: {
          latitude: input.latitude,
          longitude: input.longitude,
          precisionMeters: 12,
        },
        regionCode: input.regionCode,
        slug: input.slug,
        title: input.title,
      }),
    onSuccess: async (spring) => {
      await queryClient.invalidateQueries({ queryKey: ['public-spring-catalog'] });

      if (spring.isPublished) {
        await queryClient.invalidateQueries({ queryKey: ['public-spring-detail', spring.id] });
        onOpenPublishedSpring(spring.id);
        return;
      }

      setDraftSuccess({
        slug: spring.slug,
        title: spring.title,
      });
    },
  });

  const mapPalette: MapSurfacePalette = {
    markerSurface: tokens.bg.canvas,
    noWater: tokens.status.noWater.bg,
    outline: tokens.border.strong,
    selectedRing: tokens.action.primary.bg,
    stale: tokens.status.stale.bg,
    unknown: tokens.status.unknown.bg,
    water: tokens.status.water.bg,
  };

  const handleCoordinateChange = (change: CoordinatePickerChange) => {
    setLatitudeText(change.coordinate.latitude.toFixed(6));
    setLongitudeText(change.coordinate.longitude.toFixed(6));
  };

  const resolveSlugBeforeSubmit = async () => {
    const resolvedSlug = await createSpringFlow.resolveSuggestedSlug(slug || title);

    if (resolvedSlug !== slug) {
      slugTouchedRef.current = true;
      setSlug(resolvedSlug);
      setValidationMessage('הסלאג עודכן כדי לשמור על צורה תקינה וייחודית. בדקו ואשרו שוב.');

      return null;
    }

    return resolvedSlug;
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setValidationMessage(null);
    setDraftSuccess(null);

    const latitude = Number(latitudeText);
    const longitude = Number(longitudeText);

    if (!title.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setValidationMessage('יש למלא כותרת וקואורדינטות תקינות לפני יצירת מעיין.');

      return;
    }

    const resolvedSlug = await resolveSlugBeforeSubmit();

    if (!resolvedSlug) {
      return;
    }

    try {
      await createMutation.mutateAsync({
        accessNotes: accessNotes.trim() || null,
        alternateNames: alternateNamesText
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        description: description.trim() || null,
        isPublished: publicationState === 'published',
        latitude,
        longitude,
        regionCode: regionCode.trim() || null,
        slug: resolvedSlug,
        title: title.trim(),
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'יצירת המעיין נכשלה.');
    }
  };

  if (snapshot.primaryRole !== 'admin') {
    return (
      <Screen testID="admin-create-spring-unauthorized">
        <Card variant="raised">
          <Stack gap="3">
            <AppText variant="titleLg">גישה מוגבלת למנהלים</AppText>
            <AppText tone="secondary" variant="bodySm">
              יצירת מעיין חדש נשארת חסומה אלא אם הסשן המחובר מזוהה כמנהל.
            </AppText>
            <Button label="חזרה" onPress={onBack} variant="ghost" />
          </Stack>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scrollable testID="admin-create-spring-screen">
      <Inline justify="between">
        <Button label="חזרה" onPress={onBack} variant="ghost" />
      </Inline>

      <Card variant="raised">
        <Stack gap="3">
          <AppText variant="titleLg">יצירת מעיין חדש</AppText>
          <AppText tone="secondary" variant="bodySm">
            Phase 8 שומר על יצירת מעיין כפעולת מנהל בלבד. ברירת המחדל היא טיוטה, ורק פרסום מפורש
            מוסיף את המעיין למשטחי הקריאה הציבוריים.
          </AppText>
          {!offlineQueue.snapshot.isOnline ? (
            <AppText testID="admin-create-offline-message" tone="secondary" variant="bodySm">
              יצירת מעיין חדש נשארת אונליין-בלבד. אין תור אופליין לפעולת ניהול זו.
            </AppText>
          ) : null}
        </Stack>
      </Card>

      <Card>
        <Stack gap="3">
          <TextField
            label="שם המעיין"
            onChangeText={(value) => {
              setTitle(value);
              if (!slugTouchedRef.current) {
                requestSuggestedSlug(value);
              }
            }}
            testID="admin-create-title"
            value={title}
          />
          <TextField
            helperText="הסלאג נוצר אוטומטית מהכותרת, אך אפשר לערוך אותו ידנית."
            label="Slug"
            onBlur={() => {
              if (!slug.trim()) {
                return;
              }

              void createSpringFlow.resolveSuggestedSlug(slug).then((resolvedSlug) => {
                setSlug(resolvedSlug);
              });
            }}
            onChangeText={(value) => {
              slugTouchedRef.current = true;
              setSlug(value);
            }}
            testID="admin-create-slug"
            value={slug}
          />
          <TextField
            helperText="שמות חלופיים מופרדים בפסיקים."
            label="שמות חלופיים"
            onChangeText={setAlternateNamesText}
            testID="admin-create-alternate-names"
            value={alternateNamesText}
          />
          <TextField
            label="קוד אזור"
            onChangeText={setRegionCode}
            testID="admin-create-region-code"
            value={regionCode}
          />
        </Stack>
      </Card>

      <Card testID="admin-create-coordinate-picker">
        <Stack gap="3">
          <AppText variant="titleMd">בחירת מיקום</AppText>
          <AppText tone="secondary" variant="bodySm">
            קודם בוחרים נקודה על המפה, ואז מעדנים את הקואורדינטות ידנית אם צריך.
          </AppText>
          <View
            style={{
              borderRadius: tokens.radius.lg,
              height: 260,
              overflow: 'hidden',
            }}
          >
            <CoordinatePickerSurface
              onChange={handleCoordinateChange}
              palette={mapPalette}
              selectedCoordinate={selectedCoordinate}
              testID="admin-coordinate-picker"
              viewport={initialIsraelViewport}
            />
          </View>
          <Inline gap="2">
            <TextField
              keyboardType="numeric"
              label="Latitude"
              onChangeText={setLatitudeText}
              testID="admin-create-latitude"
              value={latitudeText}
            />
            <TextField
              keyboardType="numeric"
              label="Longitude"
              onChangeText={setLongitudeText}
              testID="admin-create-longitude"
              value={longitudeText}
            />
          </Inline>
        </Stack>
      </Card>

      <Card>
        <Stack gap="3">
          <Inline gap="2">
            <Button
              label="שמור כטיוטה"
              onPress={() => setPublicationState('draft')}
              testID="admin-create-draft-toggle"
              variant={publicationState === 'draft' ? 'primary' : 'secondary'}
            />
            <Button
              label="פרסם"
              onPress={() => setPublicationState('published')}
              testID="admin-create-published-toggle"
              variant={publicationState === 'published' ? 'primary' : 'secondary'}
            />
          </Inline>
          <TextAreaField
            label="הערות גישה"
            onChangeText={setAccessNotes}
            testID="admin-create-access-notes"
            value={accessNotes}
          />
          <TextAreaField
            label="תיאור ציבורי"
            onChangeText={setDescription}
            testID="admin-create-description"
            value={description}
          />
          {validationMessage ? (
            <AppText testID="admin-create-validation" tone="secondary" variant="bodySm">
              {validationMessage}
            </AppText>
          ) : null}
          {submitError ? (
            <AppText testID="admin-create-error" tone="secondary" variant="bodySm">
              {submitError}
            </AppText>
          ) : null}
          {draftSuccess ? (
            <Card testID="admin-create-draft-success">
              <Stack gap="1">
                <AppText variant="labelMd">הטיוטה נשמרה</AppText>
                <AppText tone="secondary" variant="bodySm">
                  {draftSuccess.title} נשמר כטיוטה עם הסלאג {draftSuccess.slug}.
                </AppText>
              </Stack>
            </Card>
          ) : null}
          <Button
            disabled={createMutation.isPending || !offlineQueue.snapshot.isOnline}
            label={publicationState === 'published' ? 'צור ופרסם' : 'צור טיוטה'}
            onPress={() => void handleSubmit()}
            stretch
            testID="admin-create-submit"
          />
        </Stack>
      </Card>
    </Screen>
  );
}
