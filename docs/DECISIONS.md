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

## ADR-0017: Use A Report-Centered Relational Core With Explicit Projection Tables

- Status: Accepted
- Date: 2026-03-26
- Decision: Phase 4 implements a normalized schema around `springs`, `spring_reports`, `report_media`, `moderation_actions`, `audit_entries`, and `spring_status_projections`, with report history plus moderation state remaining the source of truth.
- Why: The product depends on evidence history, moderation, auditability, and future trust scoring. A naive boolean status model would break those requirements immediately.
- Alternatives considered: store a single mutable water-status field on `springs`; keep only reports and derive everything ad hoc at read time with no cache table.
- Consequences: `spring_status_projections` is allowed as a derived cache only, and infrastructure or UI code must never treat it as primary truth.

## ADR-0018: Use PostGIS Geography Points And Focused Read Indexes

- Status: Accepted
- Date: 2026-03-26
- Decision: Store canonical spring locations and optional report evidence locations as `extensions.geography(point, 4326)` and back them with GiST indexes, alongside B-tree indexes for moderation, audit, and history reads.
- Why: The app is map-first for discovery and needs scalable viewport and proximity reads without hardwiring a provider SDK into the data model.
- Alternatives considered: store raw latitude/longitude decimals only; defer geospatial support until map implementation time.
- Consequences: Phase 4 can support geospatial browse queries later without rewriting the schema, and later repository implementations can expose simple lat/lng shapes while keeping the underlying geospatial model swappable.

## ADR-0019: Model Profiles And Roles As Auth-Backed Tables Plus Read Models

- Status: Accepted
- Date: 2026-03-26
- Decision: Use `auth.users` as the identity source, `user_profiles` for app-specific profile and trust snapshot fields, `user_role_assignments` for historical role membership, and `user_profile_role_summary` as the contract-facing read model.
- Why: The contract requires both `primaryRole` and `roleSet`, while the role system also needs future revocation history and a safe default signup role.
- Alternatives considered: store one mutable role field on the profile row only; keep only a role join table and push all primary-role derivation into every repository query.
- Consequences: Phase 4 adds signup bootstrap and summary-view helpers, and Phase 5 policy work should key off active role assignments rather than a UI-local assumption.

## ADR-0020: Phase 5 Uses Minimal Public Read Surfaces And DB-Backed Role Checks

- Status: Accepted
- Date: 2026-03-26
- Decision: Keep anonymous access minimal in Phase 5 by exposing only a narrow `public.public_spring_catalog` view, while raw tables stay behind direct grants plus RLS that consult active roles from `user_role_assignments` through database helper functions.
- Why: The app needs secure public browse capability without exposing raw reports, moderation state, trust signals, or internal projection lineage. Using DB-backed role helpers avoids stale JWT role drift and keeps the policy source of truth aligned to the normalized role model.
- Alternatives considered: grant anonymous reads directly on raw `springs` and `spring_status_projections`; use JWT role claims as the primary authorization source; expose approved reports publicly in Phase 5.
- Consequences: Future public detail/report-history reads must come from deliberate read models or signed URL flows, not widened raw-table grants. Policy changes now land primarily in SQL migrations and policy tests, not in UI guard code.

## ADR-0021: Role Management Is RPC-Only And Trusted Contributors Stay Flat In Phase 5

- Status: Accepted
- Date: 2026-03-26
- Decision: Role assignment changes are restricted to admin-only RPCs that preserve history and write audit entries, while `trusted_contributor` remains policy-equivalent to `user` in Phase 5.
- Why: This keeps moderation and admin boundaries strong, avoids premature trust-based privilege expansion, and prevents clients from mutating historical role records directly.
- Alternatives considered: allow direct table writes for admin role changes; let trusted contributors create springs in Phase 5; let trusted contributor reports skip moderation.
- Consequences: The policy structure is ready for future trusted-contributor expansion, but no extra write, moderation, or publication power is granted until the later trust-model phase.

## ADR-0022: Phase 6 Uses MapLibre Behind `packages/map-core` With A Fixture-Backed Browse Shell

- Status: Accepted
- Date: 2026-03-26
- Decision: Phase 6 introduces the first concrete map provider through `packages/map-core`, keeps provider imports isolated there, defers clustering, and feeds the browse shell from a local fixture that mirrors `public.public_spring_catalog` instead of wiring backend browse repositories early.
- Why: The app needs a real mobile map-browse foundation now, but the phase is explicitly not authorized to start the Phase 7 detail flow or a broader backend integration slice. This keeps the provider boundary intact, keeps screens thin, and proves the public-safe browse contract without widening data access.
- Alternatives considered: import MapLibre directly in the screen; wire a Supabase client into the map screen now; add clustering immediately; keep the map entirely mocked for another phase.
- Consequences: The default mobile route is now the map-browse shell, marker selection is teaser-only in Phase 6, development builds are required for native MapLibre verification, and repository-backed browse integration remains a later explicit change.

## ADR-0023: The Real Supabase Project Uses The Exact `maayanhot` Name And Is Linked Locally

- Status: Accepted
- Date: 2026-03-26
- Decision: Create and link the remote Supabase project with the exact name `maayanhot`, using project ref `xcjjvundvdpkxnkkkplp` in the existing org.
- Why: The project naming requirement is explicit, and Phase 6 authorized a real creation/link attempt before the map work began.
- Alternatives considered: defer remote project creation longer; create a differently named temporary project.
- Consequences: The repo is now linked to the correctly named remote Supabase project without exposing secrets, while actual repository/data-client integration remains deferred to later phases.

## ADR-0024: Phase 7 Keeps Spring Detail Public-Safe And Routes Navigation Through `packages/navigation-core`

- Status: Accepted
- Date: 2026-03-26
- Decision: Build the first spring-detail read flow on a local fixture that mirrors a future public-safe detail read model, keep the screen read-only, and route all external navigation handoff through `packages/navigation-core` via a concrete adapter instead of direct screen-level URL logic.
- Why: Phase 7 needs a real detail flow now, but it is not authorized to start repository-backed writes, raw report browsing, or provider-specific navigation calls in the UI. This keeps the read path aligned to the approved public-safe surface and preserves swappable navigation infrastructure.
- Alternatives considered: read raw tables directly from the screen; expose trust and moderation details in the public summary; build provider URLs directly in the detail screen; defer detail flow entirely until later repository work.
- Consequences: The teaser remains lightweight, the detail route is clearly separate, approved gallery/history data stays bounded, and future repository-backed detail reads must preserve the same public-safe shape.

## ADR-0025: Phase 8 Moves Mobile Reads/Writes Onto App-Local Repositories And Real Dev Sessions

- Status: Accepted
- Date: 2026-03-26
- Decision: Phase 8 adds an app-local infrastructure layer under `apps/mobile/src/infrastructure`, uses `@supabase/supabase-js` only inside that layer and `packages/upload-core`, wraps the app in TanStack Query providers, and introduces a development-only session switcher backed by real Supabase auth sessions.
- Why: Real create/report flows need stable server IDs, repository-backed public-safe reads, and true role enforcement from the linked `maayanhot` project instead of local fake roles or fixtures.
- Alternatives considered: keep fixture-backed product routes longer; put Supabase calls directly in screens; use local fake roles for development sessions.
- Consequences: Product routes now read through repository-backed public-safe surfaces, screens stay thin, and the development session switcher is explicitly temporary infrastructure that can be disabled later with env gating.

## ADR-0026: Phase 8 Uses Slot-Based Sequential Uploads And A Manual First-Admin Bootstrap

- Status: Accepted
- Date: 2026-03-26
- Decision: Uploads are now modeled as `create_report_media_slot` plus binary upload plus `finalize_report_media_upload`, with the first concrete Supabase storage adapter living inside `packages/upload-core`. The initial demo admin role assignment remains a one-time manual SQL bootstrap because the admin RPCs cannot create the first admin from nothing.
- Why: This preserves the report-centered moderation model, keeps storage/provider logic isolated, enables retry against the same reserved slot, and avoids weakening the Phase 5 security model just to make Phase 8 easier.
- Alternatives considered: upload directly from screens; create media rows after uploading with ad hoc metadata; bypass manual bootstrap by widening role-management policies.
- Consequences: Upload retries reuse the same reserved media slot, report submissions remain pending until moderation, and project setup now requires a documented one-time demo-admin bootstrap step in the linked Supabase project.

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
- Phase 4 Supabase local project baseline: `supabase/config.toml` now pins `project_id = "maayanhot"` and PostgreSQL 17 for local structure.
- Phase 4 database baseline: report-centered relational schema with explicit projection tables, PostGIS geography columns, auth-backed profiles, and historical role assignments.
- Phase 4 tooling support baseline: `@types/node@24.12.0` was added so filesystem-based schema integrity tests stay aligned to the pinned Node 24 runtime line.
- Phase 5 security baseline: raw tables are protected by direct grants plus RLS, anonymous access is limited to `public.public_spring_catalog`, and storage access for `report-media` follows a strict owner/report path convention.
- Phase 5 role baseline: trusted contributors remain policy-equivalent to users, while role assignment writes are restricted to admin RPCs with audit logging.
- Phase 6 map baseline: `@maplibre/maplibre-react-native@10.4.0` is the first concrete provider, but only through `packages/map-core`; clustering stays deferred, and the map browse shell uses a local fixture that mirrors `public.public_spring_catalog`.
- Phase 6 runtime note: MapLibre requires a development build/native runtime and is not treated as an Expo Go feature.
- Phase 6 infrastructure note: the remote Supabase project `maayanhot` is now created and linked locally as `xcjjvundvdpkxnkkkplp`.
- Phase 7 read-flow baseline: the dedicated detail route stays on a local public-safe fixture, exposes approved gallery/history summaries only, and routes external navigation through `packages/navigation-core` rather than direct screen-level provider logic.
- Phase 8 mobile data baseline: public browse and public detail now come from repository-backed public-safe Supabase surfaces rather than local fixtures.
- Phase 8 write-flow baseline: admin spring creation and user report submission now run through app-local repositories, flow services, and a real dev-session switcher instead of local fake roles.
- Phase 8 upload baseline: uploads are sequential, slot-based, and routed through `packages/upload-core` with a Supabase storage adapter.
- Backend baseline: Supabase platform with CLI 2.84.2, PostgreSQL 17 compatibility, and PostGIS 3.6 compatibility.
- Server-state baseline: TanStack Query 5.95.2.
- Future admin-web baseline: Next.js 16.2.1, planned but not yet implemented.
