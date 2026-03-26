# Decisions

This file records architecture and delivery decisions that materially affect future work. Update it before or with code whenever a contract, provider, or phase boundary changes.

## ADR-0001: Execute One Phase At A Time

- Status: Accepted
- Date: 2026-03-26
- Decision: The project will execute exactly one authorized phase per session and stop at the end of that phase.
- Why: Prevents scope creep, hidden partial implementations, and undocumented coupling across unfinished workstreams.
- Alternatives considered: opportunistic scaffolding during planning; combined Phase 0 and Phase 1 setup.
- Consequences: Sessions may end with no product code changes, but the repository will remain coherent and reviewable.

## ADR-0002: Monorepo With Explicit Package Boundaries

- Status: Accepted
- Date: 2026-03-26
- Decision: Use a monorepo structure with `apps/`, `packages/`, `supabase/`, and `docs/`.
- Why: It supports shared contracts, clean UI/domain separation, future admin-web work, and safer multi-agent collaboration.
- Alternatives considered: single-app React Native repo; separate mobile/admin repositories.
- Consequences: Workspace tooling becomes mandatory in Phase 1, but long-term reuse and isolation improve significantly.

## ADR-0003: Mobile-First With Expo

- Status: Accepted
- Date: 2026-03-26
- Decision: Build the primary client as a React Native + Expo + TypeScript app using `expo-router`.
- Why: It best fits the requirement for mobile-first delivery, app-store readiness, and a maintainable cross-platform codebase.
- Alternatives considered: pure React Native CLI; Flutter; web-first PWA.
- Consequences: Package compatibility must follow the Expo support matrix, and SDK upgrades become explicit project decisions.

## ADR-0004: Report History Is The Source Of Truth

- Status: Accepted
- Date: 2026-03-26
- Decision: The central business entity is `SpringReport`; spring status is a derived projection, not a hand-maintained boolean.
- Why: Moderation, trust, evidence, freshness, and auditability all depend on historical report records.
- Alternatives considered: mutable `has_water` field on `springs`; manual admin status override without evidence lineage.
- Consequences: Status derivation logic must be centralized, documented, and heavily tested before public release.

## ADR-0005: Adapter-First Provider Boundaries

- Status: Accepted
- Date: 2026-03-26
- Decision: Map rendering, external navigation handoff, uploads, and backend repositories will sit behind explicit abstractions.
- Why: This protects the app from provider lock-in and keeps screens thin and restylable.
- Alternatives considered: direct provider imports inside screens; service calls embedded in components.
- Consequences: Phase 3 must define interfaces before provider implementations begin in later phases.

## ADR-0006: Documentation Is A First-Class Control Surface

- Status: Accepted
- Date: 2026-03-26
- Decision: `ANDI`, `PROGRESS`, `DECISIONS`, `UI_CONTRACT`, `API_CONTRACT`, `THEMING`, and `VERSIONS` are mandatory working files, not optional notes.
- Why: Multiple agents will touch the repo over time, and hidden assumptions are a bigger risk than upfront documentation overhead.
- Alternatives considered: informal chat history only; scattered TODO comments.
- Consequences: No meaningful contract or version change is complete until the docs are updated in the same session.

## ADR-0007: UI Must Be Restylable Without Rewriting Business Logic

- Status: Accepted
- Date: 2026-03-26
- Decision: Theming will be token-based, presentational primitives will be reusable, and presentational components will not own backend logic.
- Why: The product owner explicitly wants UI-focused and backend-focused agents to work independently where possible.
- Alternatives considered: feature-screen-local styles and data fetching; design decisions embedded directly in domain code.
- Consequences: Containers and repositories become the integration points; visual changes should rarely require schema or business-rule edits.

## ADR-0008: Security And Moderation Are V1 Concerns

- Status: Accepted
- Date: 2026-03-26
- Decision: Roles, moderation, approval workflows, storage restrictions, anti-spam thinking, and auditability are planned from the beginning.
- Why: Community reporting without abuse controls creates immediate data quality and trust problems.
- Alternatives considered: launching with open publishing and adding moderation later.
- Consequences: Schema, policies, and status projection design all depend on moderation state from the start.

## ADR-0009: Offline-Lite Is Planned Early, Implemented Late

- Status: Accepted
- Date: 2026-03-26
- Decision: Offline caching and a queued report-sync model will be designed early but implemented incrementally behind abstractions.
- Why: The app needs resilient field use, but Phase 0 and Phase 1 should not overbuild a full sync engine.
- Alternatives considered: ignore offline until later; attempt full offline maps and sync in the first implementation pass.
- Consequences: Repository and local-storage boundaries must anticipate cache and queue behavior even before the feature ships.

## ADR-0010: Version Baseline Uses Stable Lines And Explicit Pins

- Status: Accepted
- Date: 2026-03-26
- Decision: Stable versions were verified first, then recorded in `docs/VERSIONS.md` with explicit lock strategies.
- Why: Generator defaults and stale snippets drift quickly in Expo, Next.js, and Supabase ecosystems.
- Alternatives considered: rely on whatever `latest` generates at implementation time.
- Consequences: Phase 1 must honor the documented baseline unless a new version pass intentionally revises it.

## ADR-0011: Start With Plain pnpm Workspaces And Root Tooling

- Status: Accepted
- Date: 2026-03-26
- Decision: Use plain `pnpm` workspaces, root-level TypeScript/ESLint/Prettier/Vitest configs, and a minimal GitHub Actions workflow in Phase 1.
- Why: This creates a low-friction, production-oriented baseline without adding orchestration layers before the repo actually needs them.
- Alternatives considered: adding Turborepo or Nx immediately; per-package duplicated configs.
- Consequences: Task orchestration remains simple for now, and the repo can adopt a heavier orchestration layer later only if cross-workspace scale justifies it.

## ADR-0012: Pin Contributor Runtime To The Exact Current Node Latest LTS Patch

- Status: Accepted
- Date: 2026-03-26
- Decision: Pin contributor and CI runtime expectations to Node `24.14.1`, the current official Latest LTS patch, through `.nvmrc`, `.node-version`, `package.json` `engines`, and GitHub Actions.
- Why: Project policy requires the newest stable baseline unless an official stack incompatibility is documented, and no such incompatibility exists for the current Latest LTS line.
- Alternatives considered: keep the older Node `22.22.2` Maintenance LTS pin; keep a broad `24.x` range only; rely on CI alone; leave version managers unconfigured.
- Consequences: Contributors now have a single exact runtime target aligned to the newest official stable LTS baseline, and future Node upgrades become explicit repo changes instead of ambient drift.

## ADR-0013: Phase 2 Ships A Token-Only Light Theme Baseline

- Status: Accepted
- Date: 2026-03-26
- Decision: Phase 2 ships `packages/design-tokens` and `packages/ui`, keeps the theming system light-only, loads `Heebo` locally as the only active font family, and uses `springLightTheme` plus a proof-only `desertLightTheme`.
- Why: This proves central restyling, keeps Hebrew-first typography practical, and avoids adding a second active font family or dark-mode scope before the design system settles.
- Alternatives considered: keep placeholder inline styles longer; load both Heebo and Assistant immediately; add dark mode in Phase 2.
- Consequences: UI agents can now restyle through tokens and shared primitives, while future typography or dark-mode expansion remains an explicit follow-up decision.

## ADR-0014: Keep Vitest As The Sole Runner And Use A Transitional UI-Test Harness

- Status: Accepted
- Date: 2026-03-26
- Decision: Keep Vitest as the only runner in Phase 2, install `@testing-library/react-native`, but run the first primitive tests through a local `react-test-renderer` compatibility harness because the current node-only Vitest baseline does not cleanly consume the full upstream React Native testing-library runtime path.
- Why: The project explicitly chose not to add Jest in Phase 2, and changing the runner or adding a heavier React Native transform stack would have exceeded the authorized slice.
- Alternatives considered: switch to Jest for UI tests; add a broader React Native transform toolchain now; skip Phase 2 executable UI tests entirely.
- Consequences: The Phase 2 tests are small, fast, and stable, but the real `@testing-library/react-native` runtime path should be revisited later when the repo is ready for a richer React Native test environment.

## ADR-0015: Align Internal Technical Naming To `maayanhot`

- Status: Accepted
- Date: 2026-03-26
- Decision: Align the root package name, workspace scope, GitHub repository target, and future Supabase project name to `maayanhot`.
- Why: The project needs one stable technical identifier for package naming, repository publication, and future infrastructure provisioning.
- Alternatives considered: keep the older `mayyanhot` workspace scope longer; align only the GitHub repo and defer internal renames.
- Consequences: Phase 3 renames the workspace scope to `@maayanhot/*`, updates manifests/imports/docs, keeps the local filesystem folder unchanged for now, and treats `meniwap/maayanhot` as the publication target.

## ADR-0016: Separate Shared Contracts, Domain Ports, And Adapter Ports

- Status: Accepted
- Date: 2026-03-26
- Decision: Put shared serializable contracts in `packages/contracts`, pure business rules and repository ports in `packages/domain`, and provider-neutral map/navigation/upload ports in their own packages.
- Why: This keeps the backend swappable, prevents UI or provider concerns from leaking into the domain layer, and gives later infrastructure phases stable boundaries to implement against.
- Alternatives considered: keep interfaces inside the mobile app; define all ports directly in `packages/domain`; wait until backend work starts before codifying adapter packages.
- Consequences: Phase 3 introduces interface-only packages with no provider implementations, and later phases must plug concrete infrastructure into these ports instead of bypassing them.

## Version Decision Summary

- Node runtime baseline: 24.14.1.
- Contributor runtime pin: Node 24.14.1 across local version-manager files, `engines`, and CI.
- Package manager baseline: pnpm 10.33.0.
- Mobile framework baseline: Expo SDK 55 with Expo-managed dependency versions.
- Phase 1 tooling baseline: ESLint 10.1.0, `typescript-eslint` 8.57.2, Prettier 3.8.1, and Vitest 4.0.16.
- Phase 2 UI baseline: local Heebo loading through `expo-font`, token-only light themes, and the first shared presentational primitives in `packages/ui`.
- Phase 2 UI test baseline: `@testing-library/react-native` stays installed, but the executable Phase 2 primitive tests run through a local `react-test-renderer` compatibility harness under Vitest.
- Phase 3 naming baseline: internal technical naming now uses `maayanhot` and the workspace scope `@maayanhot/*`.
- Phase 3 architecture baseline: shared serializable contracts live in `packages/contracts`, pure domain rules and repository ports live in `packages/domain`, and provider-neutral adapter contracts live in `packages/map-core`, `packages/navigation-core`, and `packages/upload-core`.
- Backend baseline: Supabase platform with CLI 2.84.2, PostgreSQL 17 compatibility, and PostGIS 3.6 compatibility.
- Server-state baseline: TanStack Query 5.95.2.
- Future admin-web baseline: Next.js 16.2.1, planned but not yet implemented.
