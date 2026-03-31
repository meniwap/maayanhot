'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generateSpringSlugFromTitle } from '@maayanhot/domain';
import { CreateSpringFlow, UpdateSpringFlow } from '@maayanhot/use-cases';
import { useEffect, useRef, useState } from 'react';

import {
  AdminButton,
  AdminCard,
  AdminField,
  AdminInline,
  AdminPage,
  AdminStack,
  AdminTextArea,
} from '../../components/AdminPrimitives';
import { useAdminWebObservability } from '../../infrastructure/observability/AdminWebObservabilityProvider';
import { springRepository } from '../../infrastructure/supabase/repositories/spring-repository';

const createSpringFlow = new CreateSpringFlow(springRepository);
const updateSpringFlow = new UpdateSpringFlow(springRepository);

type AdminSpringEditorScreenProps = {
  mode: 'create' | 'edit';
  onBack: () => void;
  onSaved: (springId: string, status: 'created' | 'updated') => void;
  springId?: string | null;
};

export function AdminSpringEditorScreen({
  mode,
  onBack,
  onSaved,
  springId = null,
}: AdminSpringEditorScreenProps) {
  const observability = useAdminWebObservability();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [alternateNamesText, setAlternateNamesText] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [accessNotes, setAccessNotes] = useState('');
  const [description, setDescription] = useState('');
  const [latitudeText, setLatitudeText] = useState('31.4117');
  const [longitudeText, setLongitudeText] = useState('35.0818');
  const [publicationState, setPublicationState] = useState<'draft' | 'published'>('draft');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const hydratedRef = useRef(false);
  const slugTouchedRef = useRef(false);
  const slugRequestIdRef = useRef(0);
  const detailQuery = useQuery({
    enabled: mode === 'edit' && Boolean(springId),
    queryFn: () => springRepository.getManagedById(springId!),
    queryKey: ['admin-spring-management-detail', springId],
  });

  useEffect(() => {
    if (!detailQuery.data || hydratedRef.current) {
      return;
    }

    hydratedRef.current = true;
    setTitle(detailQuery.data.spring.title);
    setSlug(detailQuery.data.spring.slug);
    setAlternateNamesText(detailQuery.data.spring.alternateNames.join(', '));
    setRegionCode(detailQuery.data.spring.regionCode ?? '');
    setAccessNotes(detailQuery.data.spring.accessNotes ?? '');
    setDescription(detailQuery.data.spring.description ?? '');
    setLatitudeText(detailQuery.data.spring.location.latitude.toFixed(6));
    setLongitudeText(detailQuery.data.spring.location.longitude.toFixed(6));
    setPublicationState(detailQuery.data.spring.isPublished ? 'published' : 'draft');
  }, [detailQuery.data]);

  const requestSuggestedSlug = (value: string) => {
    const requestId = slugRequestIdRef.current + 1;

    slugRequestIdRef.current = requestId;
    setSlug(generateSpringSlugFromTitle(value));

    const promise =
      mode === 'edit' && springId
        ? updateSpringFlow.resolveSuggestedSlug(value, springId)
        : createSpringFlow.resolveSuggestedSlug(value);

    void promise.then((resolvedSlug) => {
      if (slugRequestIdRef.current === requestId && !slugTouchedRef.current) {
        setSlug(resolvedSlug);
      }
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const latitude = Number(latitudeText);
      const longitude = Number(longitudeText);

      if (!title.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error('יש למלא כותרת וקואורדינטות תקינות.');
      }

      if (mode === 'edit' && springId) {
        return updateSpringFlow.submit({
          accessNotes: accessNotes.trim() || null,
          alternateNames: alternateNamesText
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
          description: description.trim() || null,
          isPublished: publicationState === 'published',
          location: {
            latitude,
            longitude,
            precisionMeters: 12,
          },
          regionCode: regionCode.trim() || null,
          slug: slug.trim(),
          springId,
          title: title.trim(),
        });
      }

      return createSpringFlow.submit({
        accessNotes: accessNotes.trim() || null,
        alternateNames: alternateNamesText
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        description: description.trim() || null,
        isPublished: publicationState === 'published',
        location: {
          latitude,
          longitude,
          precisionMeters: 12,
        },
        regionCode: regionCode.trim() || null,
        slug: slug.trim(),
        title: title.trim(),
      });
    },
    onSuccess: async (spring) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-spring-management-list'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-spring-management-detail', spring.id] }),
        queryClient.invalidateQueries({ queryKey: ['public-spring-catalog'] }),
        queryClient.invalidateQueries({ queryKey: ['public-spring-detail', spring.id] }),
      ]);
      setSuccessMessage(mode === 'edit' ? 'השינויים נשמרו.' : 'המעיין נוצר בהצלחה.');
      void observability.analytics.track({
        metadata: {
          isPublished: spring.isPublished,
          mode,
          springId: spring.id,
        },
        name: 'admin_spring_saved',
      });
      onSaved(spring.id, mode === 'edit' ? 'updated' : 'created');
    },
  });

  const resolveSlugBeforeSubmit = async () => {
    const resolvedSlug =
      mode === 'edit' && springId
        ? await updateSpringFlow.resolveSuggestedSlug(slug || title, springId)
        : await createSpringFlow.resolveSuggestedSlug(slug || title);

    if (resolvedSlug !== slug) {
      slugTouchedRef.current = true;
      setSlug(resolvedSlug);
      setValidationMessage('הסלאג עודכן כדי לשמור על צורה ייחודית. בדקו ואשרו שוב.');

      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setValidationMessage(null);
    setErrorMessage(null);
    setSuccessMessage(null);

    const canSubmit = await resolveSlugBeforeSubmit();

    if (!canSubmit) {
      return;
    }

    try {
      await saveMutation.mutateAsync();
    } catch (error) {
      void observability.errors.captureError(error, {
        action: mode === 'edit' ? 'update_spring' : 'create_spring',
        feature: 'admin_spring_management',
        metadata: {
          mode,
          springId,
        },
        severity: 'error',
      });
      setErrorMessage(error instanceof Error ? error.message : 'שמירת המעיין נכשלה.');
    }
  };

  const titleText = mode === 'edit' ? 'עריכת מעיין' : 'יצירת מעיין';
  const subtitle =
    mode === 'edit'
      ? 'עריכה עוברת דרך RPC אדמיני ייעודי ושומרת על audit linkage.'
      : 'Phase 13 מעביר את יצירת המעיין גם ל־admin-web, בלי לשנות את מודל הכתיבה המאושר.';

  if (mode === 'edit' && detailQuery.isLoading) {
    return (
      <AdminPage title={titleText}>
        <AdminCard testId="admin-spring-editor-loading">טוען נתוני מעיין...</AdminCard>
      </AdminPage>
    );
  }

  if (mode === 'edit' && detailQuery.isError) {
    return (
      <AdminPage title={titleText}>
        <AdminCard testId="admin-spring-editor-error">טעינת נתוני העריכה נכשלה.</AdminCard>
      </AdminPage>
    );
  }

  if (mode === 'edit' && !detailQuery.data) {
    return (
      <AdminPage title={titleText}>
        <AdminCard testId="admin-spring-editor-not-found">המעיין שביקשתם לערוך לא נמצא.</AdminCard>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      actions={<AdminButton label="חזרה לרשימה" onClick={onBack} tone="ghost" />}
      subtitle={subtitle}
      title={titleText}
    >
      <AdminCard testId="admin-spring-editor-screen">
        <AdminStack>
          <AdminField
            label="שם המעיין"
            onChange={(value) => {
              setTitle(value);
              if (!slugTouchedRef.current) {
                requestSuggestedSlug(value);
              }
            }}
            testId="admin-web-spring-title"
            value={title}
          />
          <AdminField
            helperText="נוצר אוטומטית מהכותרת, אבל אפשר לערוך ידנית."
            label="Slug"
            onChange={(value) => {
              slugTouchedRef.current = true;
              setSlug(value);
            }}
            testId="admin-web-spring-slug"
            value={slug}
          />
          <AdminField
            label="שמות חלופיים"
            onChange={setAlternateNamesText}
            testId="admin-web-spring-alternate-names"
            value={alternateNamesText}
          />
          <AdminField
            label="קוד אזור"
            onChange={setRegionCode}
            testId="admin-web-spring-region-code"
            value={regionCode}
          />
          <AdminInline>
            <div style={{ flex: 1 }}>
              <AdminField
                label="קו רוחב"
                onChange={setLatitudeText}
                testId="admin-web-spring-latitude"
                type="number"
                value={latitudeText}
              />
            </div>
            <div style={{ flex: 1 }}>
              <AdminField
                label="קו אורך"
                onChange={setLongitudeText}
                testId="admin-web-spring-longitude"
                type="number"
                value={longitudeText}
              />
            </div>
          </AdminInline>
          <AdminInline>
            <AdminButton
              label="טיוטה"
              onClick={() => setPublicationState('draft')}
              testId="admin-web-spring-draft-toggle"
              tone={publicationState === 'draft' ? 'primary' : 'secondary'}
            />
            <AdminButton
              label="Published"
              onClick={() => setPublicationState('published')}
              testId="admin-web-spring-published-toggle"
              tone={publicationState === 'published' ? 'primary' : 'secondary'}
            />
          </AdminInline>
          <AdminTextArea
            label="הערות גישה"
            onChange={setAccessNotes}
            testId="admin-web-spring-access-notes"
            value={accessNotes}
          />
          <AdminTextArea
            label="תיאור"
            onChange={setDescription}
            testId="admin-web-spring-description"
            value={description}
          />
          {validationMessage ? (
            <div data-testid="admin-web-spring-validation">{validationMessage}</div>
          ) : null}
          {errorMessage ? <div data-testid="admin-web-spring-error">{errorMessage}</div> : null}
          {successMessage ? (
            <div data-testid="admin-web-spring-success">{successMessage}</div>
          ) : null}
          <AdminButton
            disabled={saveMutation.isPending}
            label={mode === 'edit' ? 'שמור שינויים' : 'צור מעיין'}
            onClick={() => void handleSubmit()}
            testId="admin-web-spring-submit"
          />
        </AdminStack>
      </AdminCard>
    </AdminPage>
  );
}
