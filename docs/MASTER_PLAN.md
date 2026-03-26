# Master Plan

## Delivery Approach

- Architect broadly, implement narrowly.
- Complete exactly one authorized phase at a time.
- Do not start a later phase for convenience.
- No phase is complete until its Definition of Done is satisfied, required validations pass, and the control docs are updated.

## Current Authorization

Phases 0 and 1 are complete. All later phases remain planned work and must not be executed until explicitly authorized.

## Phase 0 — Inception, Version Verification, And Control System

- Scope: establish version baseline, architecture guardrails, collaboration rules, contracts baseline, and roadmap.
- Goals:
  - verify stable versions from official sources
  - create the control documents
  - define architectural boundaries and repo layout
  - define test expectations and phase DoD
- Non-goals:
  - no app scaffold
  - no migrations
  - no providers wired
  - no runtime code
- Dependencies: none
- Key risks:
  - accidental scope creep into Phase 1
  - weak contracts that later allow hidden coupling
- Definition of Done:
  - required docs exist and are coherent
  - versions are recorded with sources and lock strategies
  - repo layout and architectural boundaries are documented
  - progress/decision coordination files are updated

## Phase 1 — Repo Foundation And Tooling

- Scope: initialize the repo structure and baseline engineering tooling.
- Goals:
  - create workspace scaffold for `apps/`, `packages/`, and `supabase/`
  - configure TypeScript, linting, formatting, test runner, and typecheck
  - add CI baseline
  - add developer scripts for install, lint, typecheck, test
- Non-goals:
  - no feature screens
  - no schema implementation beyond placeholders if needed for tooling
- Dependencies:
  - Phase 0 version baseline
  - Phase 0 repo layout decision
- Key risks:
  - generator defaults conflicting with the documented versions
  - tool churn caused by unpinned CLIs
- Definition of Done:
  - clean install works from scratch
  - lint/typecheck/test commands exist
  - CI runs the agreed baseline checks successfully
  - no product feature code has been added beyond structural scaffolding

## Phase 2 — Design System And UI Foundation

- Scope: create token-driven visual foundations and reusable UI primitives.
- Goals:
  - establish design token package
  - establish UI primitive package
  - define theme semantics for light mode and RTL readiness
  - create sample shell screens that consume tokens instead of hardcoded values
- Non-goals:
  - no direct backend data fetching in primitives
  - no business rules in presentational components
- Dependencies:
  - Phase 1 workspace and test setup
  - `docs/THEMING.md`
  - `docs/UI_CONTRACT.md`
- Key risks:
  - hardcoded styling values leaking into screens
  - visual primitives coupled to feature-specific state
- Definition of Done:
  - tokens drive color, spacing, typography, radius, and elevation
  - reusable primitives exist for layout, text, buttons, chips, cards, and inputs
  - basic component tests pass
  - sample screen composition demonstrates restylability

## Phase 3 — Domain Contracts And Abstractions

- Scope: define the shared contracts and domain interfaces before providers are implemented.
- Goals:
  - create `packages/contracts`
  - create `packages/domain`
  - define repository interfaces
  - define map, navigation, upload, and offline abstractions
  - document view-model boundaries between domain and UI
- Non-goals:
  - no real provider wiring
  - no Supabase-specific calls inside domain interfaces
- Dependencies:
  - Phase 1 workspace
  - Phase 2 UI foundations
  - `docs/API_CONTRACT.md`
- Key risks:
  - premature provider details leaking into contracts
  - inconsistent data shapes between UI and domain
- Definition of Done:
  - contracts compile cleanly
  - repository interfaces are documented and test-covered
  - provider-specific details are isolated behind abstractions
  - domain package remains UI-agnostic

## Phase 4 — Database Schema And Backend Foundation

- Scope: create the initial Supabase/Postgres/PostGIS schema baseline.
- Goals:
  - provision Supabase project structure
  - create migrations for users, roles, springs, reports, media, moderation, and audit entities
  - define indexes and seed strategy
  - set up auth/profile linkage
- Non-goals:
  - no moderation UI
  - no sync engine
- Dependencies:
  - Phase 3 contracts
  - verified Supabase/Postgres baseline
- Key risks:
  - under-modeling report history
  - weak indexing for geospatial and moderation reads
- Definition of Done:
  - migrations are reproducible
  - schema supports report-centric status derivation
  - local seed strategy is documented
  - migration/schema integrity tests pass

## Phase 5 — Security And Policy Foundation

- Scope: enforce security boundaries in the backend.
- Goals:
  - implement RLS and storage policies
  - encode admin/moderator/trusted-contributor boundaries
  - define write restrictions for reports, media, and moderation actions
  - set up basic abuse-aware policy constraints
- Non-goals:
  - no public trust escalation automation yet
- Dependencies:
  - Phase 4 schema
  - role and moderation contracts
- Key risks:
  - relying on UI checks instead of database policy
  - over-permissive media access
- Definition of Done:
  - unauthorized actions are blocked by policy
  - storage rules align with report lifecycle
  - RLS and storage policy tests pass

## Phase 6 — Mobile Map Browsing Foundation

- Scope: build the first read-only mobile map slice.
- Goals:
  - implement the mobile map screen
  - display spring markers
  - support spring selection from the map
  - introduce the first concrete map adapter behind `packages/map-core`
- Non-goals:
  - no internal route directions
  - no report submission
- Dependencies:
  - Phase 2 UI baseline
  - Phase 3 map contract
  - Phase 4 read model
- Key risks:
  - provider lock-in inside screens
  - marker rendering performance issues
- Definition of Done:
  - seeded springs can be browsed on the map
  - map code is hidden behind an adapter boundary
  - map behavior tests and basic mobile rendering tests pass

## Phase 7 — Spring Details And Read Flow

- Scope: expose the core spring detail read experience.
- Goals:
  - implement spring details screen
  - show current derived status
  - show gallery and report-history summary
  - add external navigation handoff via adapter
- Non-goals:
  - no report creation UI yet
  - no moderation tools
- Dependencies:
  - Phase 6 map flow
  - Phase 3 navigation abstraction
  - Phase 4 read models
- Key risks:
  - leaking raw backend models directly into UI
  - inconsistent status presentation
- Definition of Done:
  - user can open details from map and launch external navigation
  - detail UI uses documented view models
  - read-flow integration tests and screen tests pass

## Phase 8 — Create Spring And Submit Report Flows

- Scope: enable content creation with validation and uploads.
- Goals:
  - admin create spring flow
  - user report submission flow
  - photo attachment
  - first upload pipeline implementation
  - input validation and permission handling
- Non-goals:
  - no trusted-contributor automation yet
  - no offline queue yet
- Dependencies:
  - Phase 3 upload abstraction
  - Phase 4 schema
  - Phase 5 policies
  - Phase 7 detail flow
- Key risks:
  - direct storage logic leaking into UI
  - camera/gallery permissions handled inconsistently
- Definition of Done:
  - authorized admin can create a spring
  - user can submit a valid report with optional photos
  - create/report/upload integration tests pass
  - device permission tests cover camera and gallery flows

## Phase 9 — Moderation Workflow

- Scope: make submitted content reviewable and auditable.
- Goals:
  - moderation queue
  - approve/reject actions
  - audit entries for moderation actions
  - public visibility rules tied to approval state
- Non-goals:
  - no reputation automation beyond what moderation needs
- Dependencies:
  - Phase 4 schema
  - Phase 5 policies
  - Phase 8 report creation
- Key risks:
  - approved and rejected states not flowing consistently through read models
  - missing audit trails
- Definition of Done:
  - authorized moderators can review reports
  - approved content affects public status; rejected content does not
  - moderation logic, policy, and end-to-end moderation tests pass

## Phase 10 — Trust Model And Derived Spring Status

- Scope: formalize the trust model and the status derivation engine.
- Goals:
  - define trusted-contributor progression rules
  - implement centralized status derivation
  - implement cached status projection or read model if needed
  - codify freshness/staleness windows
- Non-goals:
  - no fully automated reputation economy
- Dependencies:
  - Phase 9 moderation workflow
  - Phase 3 domain contracts
- Key risks:
  - inconsistent status derivation in multiple locations
  - opaque trust escalation logic
- Definition of Done:
  - status is derived consistently from approved history
  - trust rules are deterministic and documented
  - derivation, escalation, and projection tests pass

## Phase 11 — Offline-Lite And Sync Queue

- Scope: add resilient offline-lite behavior behind abstractions.
- Goals:
  - cache previously viewed spring data
  - queue pending report submissions
  - implement retry/sync rules and reconnect behavior
  - isolate local persistence behind a durable local DB abstraction
- Non-goals:
  - no full offline map packs on day one
- Dependencies:
  - Phase 3 offline abstraction
  - Phase 8 report flow
  - Phase 10 projection rules
- Key risks:
  - duplicate submissions on reconnect
  - hidden divergence between local queue state and server state
- Definition of Done:
  - previously loaded data is viewable offline where supported
  - queued reports sync after reconnect
  - offline queue, reconnect, and E2E offline-lite tests pass

## Phase 12 — Search, Filters, And Quality-Of-Use Improvements

- Scope: improve discovery efficiency without rewriting foundations.
- Goals:
  - search springs
  - add filters and sorting
  - coordinate list and map interactions
  - add only clearly justified convenience features
- Non-goals:
  - no speculative social features
  - no favorites unless justified by product value and complexity
- Dependencies:
  - stable read flows from Phases 6 and 7
  - any supporting indexes from Phase 4
- Key risks:
  - UI complexity growing faster than contract clarity
  - under-indexed search/filter queries
- Definition of Done:
  - discovery is measurably more efficient
  - filters and search are documented and tested
  - integration and UI behavior tests pass

## Phase 13 — Admin Web

- Scope: create a separate admin surface for operational workflows.
- Goals:
  - scaffold admin-web app
  - provide spring management and moderation tools
  - support contributor management if justified
  - keep admin contracts aligned with the shared backend model
- Non-goals:
  - no public marketing web in the same phase unless explicitly approved
- Dependencies:
  - stable backend contracts from earlier phases
  - recorded Next.js baseline
- Key risks:
  - divergence between admin and mobile contracts
  - admin-only mutations bypassing audit expectations
- Definition of Done:
  - core admin tasks no longer depend on mobile-only flows
  - integration and admin E2E tests pass
  - shared contracts remain the source of truth

## Phase 14 — Hardening, Observability, And Performance

- Scope: make the product safer, more measurable, and more resilient.
- Goals:
  - add crash/error reporting behind an abstraction
  - add analytics hooks behind an abstraction
  - review performance hotspots
  - harden image pipeline and abuse controls
  - review rate limiting and suspicious activity handling
- Non-goals:
  - no major UX redesign
- Dependencies:
  - stable functional flows from earlier phases
- Key risks:
  - bolting in observability directly to screens
  - production issues discovered too late
- Definition of Done:
  - critical paths are instrumented
  - resilience and abuse scenarios are exercised
  - smoke performance checks and resilience validations pass

## Phase 15 — Beta And Store Readiness

- Scope: prepare the product for real distribution.
- Goals:
  - create release checklist
  - prepare privacy/legal placeholders
  - finalize onboarding polish and app metadata
  - review deep links only if justified
  - define post-beta roadmap
- Non-goals:
  - no major architecture rewrite
- Dependencies:
  - stable and tested product flows
  - hardening and observability baseline
- Key risks:
  - incomplete release readiness hidden by feature completion
  - operational requirements discovered at the end
- Definition of Done:
  - there is a clear path to beta distribution and store submission
  - release smoke tests pass
  - launch risks and deferred items are documented clearly

## Cross-Phase Risks

- Drift between UI contracts and backend contracts
- Provider-specific logic leaking into screens or domain code
- Status derivation spread across multiple layers
- Underestimating moderation and abuse-control requirements
- Overbuilding offline features before the core product loop is stable

## Cross-Phase Non-Goals

- Building an in-app turn-by-turn navigation engine in V1
- Hardwiring the app to a single concrete map provider across the codebase
- Letting presentational UI components own backend calls or business rules
- Implementing speculative future features before their phase is authorized
