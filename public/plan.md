# Implementation Plan: Multi-tenant Restaurant Management

**Branch**: `001-restaurant-management` | **Date**: 2025-11-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-restaurant-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Multi-tenant restaurant management system providing self-service onboarding, location management, operating hours configuration, and branding customization. Supports both shared multi-tenant (SMB) and dedicated single-tenant (enterprise) deployment models with activation code provisioning and strict tenant isolation. This is the foundational platform layer required for all Parcera services (menu, ordering, payments) to function.

## Technical Context

**Language/Version**: Python 3.11+ (constitution recommendation) or Node.js 18+ (pending decision)
**Primary Dependencies**: FastAPI (Python) or NestJS (Node.js), PostgreSQL 14+ with row-level security extensions, Redis for session/cache
**Storage**: PostgreSQL 14+ with row-level security for tenant isolation, schema-per-tenant OR shared schema with tenant_id columns (NEEDS CLARIFICATION - architecture decision required)
**Testing**: pytest (Python) or Jest (Node.js) for unit/integration, contract tests via OpenAPI schema validation
**Target Platform**: Linux server (Docker + Kubernetes deployment), RESTful API backend
**Project Type**: Web application (backend API + frontend business portal)
**Performance Goals**: <200ms p95 for tenant-scoped queries, support 50-100 SMB tenants initially (MVP scale), 16,000+ locations for enterprise dedicated instances
**Constraints**: Zero data leakage between tenants (100% isolation verified by audit), activation codes must expire after 30 days automatically, profile updates must reflect across all channels within 30 seconds
**Scale/Scope**: MVP: 50-100 restaurants with 1-5 locations each, Phase 2: 500 restaurants, 3-Year: 5000+ restaurants with horizontal sharding strategy

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle II: Multi-Tenancy by Design ✅ CRITICAL

**Requirements from Constitution:**
- MUST implement row-level security with tenant isolation at database layer
- MUST use tenant slugs or unique identifiers for all multi-tenant resources
- MUST support both shared (SMB) and dedicated (enterprise) deployment models
- MUST provide self-service provisioning with activation codes
- MUST design APIs with tenant context in all requests
- MUST NOT allow data leakage between tenants

**Alignment with Spec:**
- ✅ FR-003: Isolated tenant contexts with unique identifiers (slugs or UUIDs)
- ✅ FR-004: Row-level security prevents data leakage
- ✅ FR-005: Supports shared multi-tenant and dedicated single-tenant models
- ✅ FR-001, FR-002: Activation code provisioning and validation
- ✅ SC-005: Zero data leakage incidents (100% isolation verified by audit)
- ✅ User Story 4: Enterprise multi-tenant provisioning (dedicated infrastructure)

**Gate Status:** ✅ PASS - This feature IS the implementation of Constitution Principle II

**Blocking Decision:** Architecture decision required: schema-per-tenant vs shared schema with row-level security. Research needed in Phase 0.

---

### Principle V: Progressive Enhancement & MVP Discipline ✅

**Requirements from Constitution:**
- MUST define P0/P1/P2/P3 priorities for all features
- MUST ship P0 features within 3-month MVP timeline
- MUST design features as independently testable user stories
- MUST validate each user story delivers standalone value

**Alignment with Spec:**
- ✅ User Story 1: P0 - Restaurant onboarding (foundational requirement)
- ✅ User Story 2: P1 - Multi-location management
- ✅ User Story 3: P2 - Branding customization
- ✅ User Story 4: P1 - Enterprise provisioning
- ✅ User Story 5: P1 - Hours of operation
- ✅ All user stories have independent acceptance scenarios
- ✅ User Story 1 can be tested standalone and delivers immediate value

**Gate Status:** ✅ PASS - Proper prioritization applied

---

### Principle VII: Integration-Friendly Architecture ✅

**Requirements from Constitution:**
- MUST provide RESTful APIs with clear contracts for all core services
- SHOULD follow OpenAPI/Swagger standards for API documentation

**Alignment with Spec:**
- ✅ Testing specifies contract tests via OpenAPI schema validation
- ✅ RESTful API backend specified in technical context
- ⚠️ API contracts not yet defined - will be generated in Phase 1

**Gate Status:** ✅ PASS - API contracts will be generated in Phase 1

---

### Principle IV: Omnichannel by Default ⚠️ PARTIAL

**Requirements from Constitution:**
- MUST maintain order state and customer context across all channels seamlessly
- MUST ensure backend operates standalone for delivery-only businesses

**Alignment with Spec:**
- ✅ FR-016: Prevents ordering outside hours across all channels
- ✅ FR-017: Displays appropriate messaging across all channels
- ⚠️ Profile updates reflect across channels within 30 seconds (SC-004)

**Gate Status:** ✅ PASS - Restaurant profile is consumed by all channels (IVR, mobile, kiosk)

---

### Overall Gate Assessment

**STATUS: ✅ PROCEED TO PHASE 0**

**Critical Decisions Needed (Phase 0 Research):**
1. Multi-tenancy architecture pattern: schema-per-tenant vs shared schema with RLS
2. Tenant identifier strategy: UUID vs slug vs hybrid
3. Dedicated tenant provisioning approach: manual vs automated schema creation
4. Technology stack finalization: Python/FastAPI vs Node.js/NestJS

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   ├── restaurant.py             # Restaurant (Tenant) entity
│   │   ├── location.py                # Location entity
│   │   ├── operating_hours.py         # OperatingHours entity
│   │   ├── special_hours.py           # SpecialHours entity
│   │   ├── activation_code.py         # ActivationCode entity
│   │   └── tenant_settings.py         # TenantSettings entity (enterprise)
│   ├── services/
│   │   ├── tenant_service.py          # Multi-tenancy logic, tenant isolation
│   │   ├── onboarding_service.py      # Activation code validation, wizard flow
│   │   ├── location_service.py        # Location CRUD, hours validation
│   │   └── branding_service.py        # Logo upload, color config
│   ├── api/
│   │   ├── v1/
│   │   │   ├── restaurants.py         # Restaurant profile endpoints
│   │   │   ├── locations.py           # Location management endpoints
│   │   │   ├── onboarding.py          # Onboarding wizard endpoints
│   │   │   └── admin.py               # Platform admin (enterprise provisioning)
│   │   └── middleware/
│   │       └── tenant_context.py      # Inject tenant ID into all requests
│   └── db/
│       ├── migrations/                 # Database schema migrations
│       └── rls_policies.sql           # Row-level security policies
└── tests/
    ├── contract/
    │   └── openapi_validation_test.py # Validate API against OpenAPI schema
    ├── integration/
    │   ├── test_tenant_isolation.py   # Zero data leakage tests
    │   ├── test_onboarding_flow.py    # End-to-end onboarding tests
    │   └── test_multi_location.py     # Multi-location scenarios
    └── unit/
        ├── test_tenant_service.py
        ├── test_onboarding_service.py
        └── test_location_service.py

frontend/
├── src/
│   ├── components/
│   │   ├── OnboardingWizard/         # Step-by-step onboarding UI
│   │   ├── LocationManager/          # Multi-location management UI
│   │   ├── BrandingEditor/           # Logo upload, color picker
│   │   └── HoursEditor/              # Hours of operation UI
│   ├── pages/
│   │   ├── Onboarding.tsx            # Activation code entry + wizard
│   │   ├── Dashboard.tsx             # Restaurant dashboard
│   │   ├── LocationsPage.tsx         # Location list and detail views
│   │   └── SettingsPage.tsx          # Restaurant settings (branding, hours)
│   └── services/
│       ├── restaurantApi.ts          # API client for restaurant endpoints
│       └── tenantContext.tsx         # React context for tenant ID
└── tests/
    └── e2e/
        ├── onboarding_flow.spec.ts   # Cypress/Playwright onboarding tests
        └── multi_location.spec.ts    # Multi-location UI tests
```

**Structure Decision**: Web application (Option 2) - Backend API provides tenant management endpoints, frontend business portal provides self-service UI for restaurant owners. Backend handles tenant isolation and database access, frontend consumes RESTful APIs.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations detected. All gates passed.
