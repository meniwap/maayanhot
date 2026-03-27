'use client';

import type { CSSProperties, PropsWithChildren, ReactNode } from 'react';

import { adminSurfaceShadow, adminTheme } from '../lib/theme';

const labelStyle: CSSProperties = {
  color: adminTheme.text.primary,
  display: 'block',
  fontSize: adminTheme.typography.scale.labelMd.fontSize,
  fontWeight: Number(adminTheme.typography.scale.labelMd.fontWeight),
  marginBottom: adminTheme.space['2'],
};

const helperStyle: CSSProperties = {
  color: adminTheme.text.secondary,
  fontSize: adminTheme.typography.scale.bodySm.fontSize,
  marginTop: adminTheme.space['1'],
};

export function AdminPage({
  actions,
  children,
  subtitle,
  title,
}: PropsWithChildren<{
  actions?: ReactNode;
  subtitle?: string | null;
  title: string;
}>) {
  return (
    <div
      style={{
        display: 'grid',
        gap: adminTheme.space['4'],
      }}
    >
      <div
        style={{
          alignItems: 'flex-start',
          display: 'flex',
          gap: adminTheme.space['3'],
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'grid', gap: adminTheme.space['2'] }}>
          <h1
            style={{
              color: adminTheme.text.primary,
              fontSize: adminTheme.typography.scale.displayMd.fontSize,
              fontWeight: Number(adminTheme.typography.scale.displayMd.fontWeight),
              margin: 0,
            }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              style={{
                color: adminTheme.text.secondary,
                margin: 0,
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function AdminCard({ children, testId }: PropsWithChildren<{ testId?: string }>) {
  return (
    <section
      data-testid={testId}
      style={{
        background: adminTheme.bg.surface,
        border: `1px solid ${adminTheme.border.default}`,
        borderRadius: adminTheme.radius.lg,
        boxShadow: adminSurfaceShadow,
        padding: adminTheme.space['4'],
      }}
    >
      {children}
    </section>
  );
}

export function AdminButton({
  disabled = false,
  href,
  label,
  onClick,
  testId,
  tone = 'primary',
  type = 'button',
}: {
  disabled?: boolean;
  href?: string;
  label: string;
  onClick?: () => void;
  testId?: string;
  tone?: 'ghost' | 'primary' | 'secondary' | 'danger';
  type?: 'button' | 'submit';
}) {
  const palette =
    adminTheme.action[
      tone === 'secondary'
        ? 'secondary'
        : tone === 'ghost'
          ? 'ghost'
          : tone === 'danger'
            ? 'danger'
            : 'primary'
    ];

  const style: CSSProperties = {
    alignItems: 'center',
    background: disabled ? adminTheme.bg.surfaceMuted : palette.bg,
    border:
      tone === 'ghost'
        ? 'none'
        : `1px solid ${disabled ? adminTheme.border.subtle : palette.border}`,
    borderRadius: adminTheme.radius.round,
    color: disabled ? adminTheme.text.muted : palette.fg,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    fontSize: adminTheme.typography.scale.labelMd.fontSize,
    fontWeight: Number(adminTheme.typography.scale.labelMd.fontWeight),
    justifyContent: 'center',
    minHeight: 44,
    opacity: disabled ? 0.65 : 1,
    padding: `${adminTheme.space['2']}px ${adminTheme.space['4']}px`,
    textDecoration: 'none',
  };

  if (href) {
    return (
      <a data-testid={testId} href={href} style={style}>
        {label}
      </a>
    );
  }

  return (
    <button data-testid={testId} disabled={disabled} onClick={onClick} style={style} type={type}>
      {label}
    </button>
  );
}

export function AdminField({
  helperText,
  label,
  onChange,
  testId,
  type = 'text',
  value,
}: {
  helperText?: string | null;
  label: string;
  onChange: (value: string) => void;
  testId?: string;
  type?: 'number' | 'password' | 'text';
  value: string;
}) {
  return (
    <label>
      <span style={labelStyle}>{label}</span>
      <input
        data-testid={testId}
        onChange={(event) => onChange(event.target.value)}
        style={{
          background: adminTheme.bg.canvas,
          border: `1px solid ${adminTheme.border.default}`,
          borderRadius: adminTheme.radius.md,
          color: adminTheme.text.primary,
          minHeight: 44,
          padding: `${adminTheme.space['2']}px ${adminTheme.space['3']}px`,
          width: '100%',
        }}
        type={type}
        value={value}
      />
      {helperText ? <div style={helperStyle}>{helperText}</div> : null}
    </label>
  );
}

export function AdminTextArea({
  helperText,
  label,
  onChange,
  rows = 4,
  testId,
  value,
}: {
  helperText?: string | null;
  label: string;
  onChange: (value: string) => void;
  rows?: number;
  testId?: string;
  value: string;
}) {
  return (
    <label>
      <span style={labelStyle}>{label}</span>
      <textarea
        data-testid={testId}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        style={{
          background: adminTheme.bg.canvas,
          border: `1px solid ${adminTheme.border.default}`,
          borderRadius: adminTheme.radius.md,
          color: adminTheme.text.primary,
          padding: `${adminTheme.space['2']}px ${adminTheme.space['3']}px`,
          resize: 'vertical',
          width: '100%',
        }}
        value={value}
      />
      {helperText ? <div style={helperStyle}>{helperText}</div> : null}
    </label>
  );
}

export function AdminPill({
  label,
  tone = 'info',
  testId,
}: {
  label: string;
  testId?: string;
  tone?: 'error' | 'info' | 'success' | 'warning';
}) {
  const background =
    tone === 'success'
      ? adminTheme.status.water.bg
      : tone === 'warning'
        ? adminTheme.status.stale.bg
        : tone === 'error'
          ? adminTheme.status.noWater.bg
          : adminTheme.bg.accent;
  const color =
    tone === 'success'
      ? adminTheme.status.water.fg
      : tone === 'warning'
        ? adminTheme.status.stale.fg
        : tone === 'error'
          ? adminTheme.status.noWater.fg
          : adminTheme.text.primary;

  return (
    <span
      data-testid={testId}
      style={{
        background,
        borderRadius: adminTheme.radius.round,
        color,
        display: 'inline-flex',
        fontSize: adminTheme.typography.scale.labelSm.fontSize,
        fontWeight: Number(adminTheme.typography.scale.labelSm.fontWeight),
        padding: `${adminTheme.space['1']}px ${adminTheme.space['2']}px`,
      }}
    >
      {label}
    </span>
  );
}

export function AdminStack({
  children,
  gap = adminTheme.space['3'],
}: PropsWithChildren<{ gap?: number }>) {
  return (
    <div
      style={{
        display: 'grid',
        gap,
      }}
    >
      {children}
    </div>
  );
}

export function AdminInline({
  align = 'center',
  children,
  gap = adminTheme.space['2'],
  justify = 'flex-start',
  wrap = true,
}: PropsWithChildren<{
  align?: CSSProperties['alignItems'];
  gap?: number;
  justify?: CSSProperties['justifyContent'];
  wrap?: boolean;
}>) {
  return (
    <div
      style={{
        alignItems: align,
        display: 'flex',
        flexWrap: wrap ? 'wrap' : 'nowrap',
        gap,
        justifyContent: justify,
      }}
    >
      {children}
    </div>
  );
}
