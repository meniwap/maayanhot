# Theming

## Purpose

The UI must be easy to restyle without rewriting the domain layer, backend integration, or screen logic. This file defines the token system and style rules that make that possible.

## Core Rules

- No raw colors in feature screens.
- No ad hoc spacing values in feature screens.
- No font-family literals in feature screens.
- Shared components consume semantic tokens, not hardcoded palette values.
- Direction-sensitive layout must use start/end semantics, not left/right assumptions.

## Visual Direction Baseline

The initial design direction is light-first, terrain-and-water inspired, and Hebrew-first friendly.

Reference palette seeds:

| Seed token   | Value     | Intended use                       |
| ------------ | --------- | ---------------------------------- |
| `stone-950`  | `#182018` | strongest text / dark surfaces     |
| `stone-800`  | `#2E3A2D` | headings / strong borders          |
| `stone-600`  | `#556252` | secondary text                     |
| `sand-50`    | `#F6F3E8` | base canvas                        |
| `sand-100`   | `#EEE7D7` | subtle surface contrast            |
| `water-700`  | `#1F6F8B` | primary action emphasis            |
| `water-500`  | `#3D9BB6` | secondary accents                  |
| `spring-600` | `#2E8B62` | positive/water-present status      |
| `amber-600`  | `#B27A16` | caution / stale indicators         |
| `clay-700`   | `#9E5A3C` | no-water or dry-condition emphasis |
| `danger-700` | `#B33A2C` | destructive and error states       |

These seed values are starting points only. Screens must consume semantic aliases, not seed names.

## Semantic Color Tokens

Planned semantic token groups:

- Background
  - `bg.canvas`
  - `bg.surface`
  - `bg.surfaceRaised`
  - `bg.surfaceMuted`
  - `bg.accent`
- Text
  - `text.primary`
  - `text.secondary`
  - `text.muted`
  - `text.inverse`
  - `text.link`
- Border
  - `border.subtle`
  - `border.default`
  - `border.strong`
- Action
  - `action.primary.bg`
  - `action.primary.fg`
  - `action.secondary.bg`
  - `action.secondary.fg`
  - `action.ghost.fg`
- Status
  - `status.water.bg`
  - `status.water.fg`
  - `status.noWater.bg`
  - `status.noWater.fg`
  - `status.unknown.bg`
  - `status.unknown.fg`
  - `status.stale.bg`
  - `status.stale.fg`
  - `status.pending.bg`
  - `status.pending.fg`
- Feedback
  - `feedback.success`
  - `feedback.warning`
  - `feedback.error`
  - `feedback.info`

## Typography Baseline

Active Phase 2 type family:

- Display / headings: `Heebo`
- Body / controls: `Heebo`

Reason selected now:

- it is Hebrew-friendly, available as a locally bundled asset, and keeps the first theme pass simple
- it supports a clean, consistent visual baseline without introducing a second loaded family before the design system settles

Deferred typography option:

- `Assistant` remains a documented future option only
- it is not loaded, not referenced in active tokens, and not required by any Phase 2 component

Typography scale:

| Token             | Suggested size / line height | Intended use                 |
| ----------------- | ---------------------------- | ---------------------------- |
| `type.display.lg` | `34 / 40`                    | key headers                  |
| `type.display.md` | `28 / 34`                    | screen titles                |
| `type.title.lg`   | `22 / 28`                    | section titles               |
| `type.title.md`   | `18 / 24`                    | cards / sheet titles         |
| `type.body.lg`    | `17 / 24`                    | long-form body               |
| `type.body.md`    | `15 / 22`                    | default body                 |
| `type.body.sm`    | `13 / 18`                    | metadata                     |
| `type.label.md`   | `14 / 18`                    | controls                     |
| `type.label.sm`   | `12 / 16`                    | chips / badges / helper text |

Font-weight guidance:

- display titles: `700`
- section titles: `600`
- body text: `400`
- labels/actions: `500`

Phase 2 loading rule:

- load `Heebo` only, from bundled local app assets via `expo-font`
- do not fetch fonts remotely at runtime

## Spacing Scale

Base unit: `4`

| Token      | Value |
| ---------- | ----- |
| `space.0`  | `0`   |
| `space.1`  | `4`   |
| `space.2`  | `8`   |
| `space.3`  | `12`  |
| `space.4`  | `16`  |
| `space.5`  | `20`  |
| `space.6`  | `24`  |
| `space.8`  | `32`  |
| `space.10` | `40`  |
| `space.12` | `48`  |

Screen layout guidance:

- screen horizontal padding should come from tokens only
- list gaps and section spacing should reuse the shared scale
- no one-off values like `18`, `26`, or `37` in feature screens without documented justification

## Radius, Elevation, And Icon Sizing

Radius scale:

| Token          | Value |
| -------------- | ----- |
| `radius.sm`    | `8`   |
| `radius.md`    | `12`  |
| `radius.lg`    | `18`  |
| `radius.xl`    | `24`  |
| `radius.round` | `999` |

Elevation scale:

| Token         | Value                  |
| ------------- | ---------------------- |
| `elevation.0` | flat                   |
| `elevation.1` | subtle card lift       |
| `elevation.2` | floating surface       |
| `elevation.3` | modal / sheet emphasis |

Icon sizes:

| Token     | Value |
| --------- | ----- |
| `icon.sm` | `16`  |
| `icon.md` | `20`  |
| `icon.lg` | `24`  |
| `icon.xl` | `32`  |

## Component Variant Expectations

Components should expose semantic variants instead of custom style props wherever possible.

Shipped Phase 2 variants:

- `Button`
  - `primary`
  - `secondary`
  - `ghost`
  - `danger`
- `Chip`
  - `filter`
  - `selected`
  - `status`
- `Card`
  - `default`
  - `raised`
- `StatusBadge`
  - `water`
  - `noWater`
  - `unknown`
  - `stale`
  - `pending`

Deferred variants and components:

- `TextField`
- `TextAreaField`
- `IconButton`
- `PhotoTile`
- `EmptyState`
- `ErrorState`
- `LoadingState`

## Motion Guidance

- keep motion meaningful and sparse
- prefer screen-enter, list-stagger, and state-transition motion over constant micro-animation
- motion must degrade gracefully on lower-end devices
- motion tokens should sit alongside theme tokens, not inside individual feature components

## Dark/Light Strategy

- Phase 2 ships light themes only.
- `springLightTheme` is the default system theme.
- `desertLightTheme` exists only as a proof theme to demonstrate central restyling without component rewrites.
- Dark mode remains deferred and must stay token-driven when it is introduced later.

## RTL And Hebrew-First Rules

- use `start` and `end` semantics for alignment, padding, and margins
- mirror directional icons where appropriate
- verify truncation and line breaking with Hebrew strings early
- ensure mixed Hebrew/English content remains legible in chips, map teasers, and metadata rows

## Anti-Patterns

Do not:

- set raw hex values inside feature screens
- inline arbitrary spacing numbers repeatedly
- pick component colors based on business logic inside presenters
- hardcode font families or weights inside feature screens
- let map/provider UI widgets dictate the app's design language
