# Data Model: Multi-tenant Restaurant Management

**Feature**: 001-restaurant-management
**Created**: 2025-11-03
**Status**: Technical Specification
**PostgreSQL Version**: 14+

---

## Overview

This document defines the complete data model for the Multi-tenant Restaurant Management feature, including PostgreSQL schema definitions, entity relationships, Row-Level Security (RLS) policies, indexes, validation rules, and state transitions.

**Architecture Pattern**: Hybrid Multi-Tenancy
- **SMB Tenants**: Row-Level Security (RLS) on shared schema
- **Enterprise Tenants**: Schema-per-tenant for dedicated deployments

---

## Entity Relationship Diagram

```plaintext
┌─────────────────────┐
│     Tenants         │
│ ─────────────────── │
│ id (UUID, PK)       │
│ slug (VARCHAR)      │
│ name                │
│ deployment_type     │
└──────────┬──────────┘
           │
           │ 1:N
           │
┌──────────▼──────────────┐
│   Restaurants           │
│ ─────────────────────── │
│ id (UUID, PK)           │
│ tenant_id (UUID, FK)    │
│ name                    │
│ branding_config         │
└──────────┬──────────────┘
           │
           │ 1:N
           │
┌──────────▼──────────────┐         ┌─────────────────────┐
│   Locations             │◄────────┤ ActivationCodes     │
│ ─────────────────────── │  N:1    │ ─────────────────── │
│ id (UUID, PK)           │         │ code (VARCHAR, PK)  │
│ restaurant_id (FK)      │         │ tenant_id (FK)      │
│ tenant_id (UUID)        │         │ email               │
│ slug                    │         │ status              │
│ address                 │         └─────────────────────┘
│ timezone                │
│ status                  │
└──────────┬──────────────┘
           │
           ├─────────────────┬─────────────────┐
           │ 1:N             │ 1:N             │
           │                 │                 │
┌──────────▼──────────┐  ┌──▼────────────┐  ┌─▼──────────────────┐
│ OperatingHours      │  │ SpecialHours  │  │ TenantSettings     │
│ ─────────────────── │  │ ────────────── │  │ ──────────────────│
│ id (UUID, PK)       │  │ id (UUID, PK) │  │ tenant_id (FK, PK) │
│ location_id (FK)    │  │ location_id   │  │ region             │
│ day_of_week         │  │ date          │  │ compliance_reqs    │
│ opening_time        │  │ reason        │  │ api_quota_limits   │
│ closing_time        │  │ override_type │  │ custom_config      │
└─────────────────────┘  └───────────────┘  └────────────────────┘
```

---

## Schema Definitions

### 1. Tenants Table (Metadata)

**Purpose**: Central registry of all tenants (SMB shared + enterprise dedicated)

```sql
-- Central tenant registry (always in public schema)
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    deployment_type VARCHAR(20) NOT NULL CHECK (deployment_type IN ('shared', 'dedicated')),
    schema_name VARCHAR(100),  -- NULL for shared, 'tenant_<slug>' for dedicated
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT schema_name_required_for_dedicated
        CHECK (deployment_type = 'shared' OR schema_name IS NOT NULL)
);

-- Indexes
CREATE UNIQUE INDEX idx_tenants_slug ON public.tenants(LOWER(slug));
CREATE INDEX idx_tenants_deployment_type ON public.tenants(deployment_type);
CREATE INDEX idx_tenants_status ON public.tenants(status);

-- Reserved slugs table
CREATE TABLE public.reserved_slugs (
    slug VARCHAR(100) PRIMARY KEY,
    reserved_by VARCHAR(100) NOT NULL,  -- System component using this slug
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed reserved slugs
INSERT INTO public.reserved_slugs (slug, reserved_by) VALUES
    ('admin', 'platform'),
    ('api', 'platform'),
    ('www', 'platform'),
    ('app', 'platform'),
    ('dashboard', 'platform'),
    ('business', 'platform'),
    ('customer', 'platform'),
    ('order', 'platform');

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Validation Rules**:
- Slug must be 3-100 characters, lowercase alphanumeric with hyphens
- Slug cannot match reserved slugs
- Schema name required only for dedicated deployments
- Deployment type immutable after creation (requires migration)

---

### 2. Restaurants Table

**Purpose**: Restaurant business profiles (tenant-level entity)

```sql
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,  -- Foreign key to public.tenants
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cuisine_type VARCHAR(100),
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed', 'pending_setup')),

    -- Branding configuration (JSONB for flexibility)
    branding_config JSONB DEFAULT '{
        "logo_url": null,
        "primary_color": "#000000",
        "secondary_color": "#FFFFFF",
        "accent_color": "#FF6B00",
        "welcome_message": null
    }'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,  -- User ID who created (future: reference users table)

    -- Constraints
    CONSTRAINT unique_restaurant_name_per_tenant UNIQUE (tenant_id, name),
    CONSTRAINT valid_email CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT valid_branding_config CHECK (
        jsonb_typeof(branding_config) = 'object' AND
        branding_config ? 'logo_url' AND
        branding_config ? 'primary_color'
    )
);

-- Enable Row-Level Security (RLS)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Tenant Isolation
CREATE POLICY tenant_isolation_policy ON restaurants
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- RLS Policy: Allow inserts for current tenant
CREATE POLICY tenant_insert_policy ON restaurants
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- Indexes
CREATE INDEX idx_restaurants_tenant_id ON restaurants(tenant_id);
CREATE INDEX idx_restaurants_status ON restaurants(status);
CREATE INDEX idx_restaurants_cuisine_type ON restaurants(cuisine_type);

-- Update trigger
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE restaurants IS 'Restaurant business profiles with branding configuration';
```

**Validation Rules**:
- Restaurant name unique within tenant (enforced by DB constraint)
- Contact email must be valid format (regex validation)
- Logo URL max 2MB file size (enforced at application layer)
- Branding colors must be valid hex codes (enforced at application layer)
- Welcome message max 500 characters (enforced at application layer)

**Branding Config Schema**:
```json
{
  "logo_url": "https://cdn.parcera.com/tenants/{tenant_id}/logo.png",
  "primary_color": "#FF6B00",
  "secondary_color": "#333333",
  "accent_color": "#00A8E8",
  "welcome_message": "Welcome to Joe's Pizza! We're glad you called."
}
```

---

### 3. Locations Table

**Purpose**: Physical restaurant locations with location-specific settings

```sql
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL,
    tenant_id UUID NOT NULL,  -- Denormalized for RLS performance
    slug VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,

    -- Address
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(2) NOT NULL DEFAULT 'US',  -- ISO 3166-1 alpha-2

    -- Contact
    phone VARCHAR(20),
    email VARCHAR(255),

    -- Timezone (IANA timezone identifier)
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/New_York',

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'permanently_closed')),

    -- Location-specific branding overrides (optional)
    branding_overrides JSONB,

    -- Coordinates (for delivery zone calculation)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT unique_location_slug_per_tenant UNIQUE (tenant_id, slug),
    CONSTRAINT fk_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    CONSTRAINT valid_timezone CHECK (
        -- Validate against common IANA timezones (subset for performance)
        timezone IN (
            'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
            'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
            'America/Toronto', 'America/Vancouver', 'America/Mexico_City'
        )
    ),
    CONSTRAINT valid_coordinates CHECK (
        (latitude IS NULL AND longitude IS NULL) OR
        (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
    )
);

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tenant_isolation_policy ON locations
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

CREATE POLICY tenant_insert_policy ON locations
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- Indexes
CREATE INDEX idx_locations_tenant_id ON locations(tenant_id);
CREATE INDEX idx_locations_restaurant_id ON locations(restaurant_id);
CREATE INDEX idx_locations_status ON locations(status);
CREATE INDEX idx_locations_coordinates ON locations(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_locations_slug ON locations(tenant_id, slug);

-- Update trigger
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE locations IS 'Physical restaurant locations with address and timezone configuration';
```

**Validation Rules**:
- Location slug unique within tenant
- Timezone must be valid IANA identifier
- Coordinates optional but must be valid if provided
- Phone number validated at application layer (E.164 format)
- One location can be marked as "primary" (enforced at application layer)

---

### 4. OperatingHours Table

**Purpose**: Regular weekly schedule for each location

```sql
CREATE TABLE operating_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL,
    tenant_id UUID NOT NULL,  -- Denormalized for RLS

    -- Day of week (0 = Sunday, 6 = Saturday)
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),

    -- Time range (stored as TIME without timezone)
    opening_time TIME,
    closing_time TIME,

    -- Closed flag (for days not operating)
    is_closed BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT fk_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    CONSTRAINT unique_day_per_location UNIQUE (location_id, day_of_week),
    CONSTRAINT valid_hours CHECK (
        is_closed = true OR
        (opening_time IS NOT NULL AND closing_time IS NOT NULL)
    ),
    CONSTRAINT no_hours_when_closed CHECK (
        is_closed = false OR (opening_time IS NULL AND closing_time IS NULL)
    )
);

-- Enable RLS
ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY tenant_isolation_policy ON operating_hours
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- Indexes
CREATE INDEX idx_operating_hours_tenant_id ON operating_hours(tenant_id);
CREATE INDEX idx_operating_hours_location_id ON operating_hours(location_id);
CREATE INDEX idx_operating_hours_day ON operating_hours(day_of_week);

-- Update trigger
CREATE TRIGGER update_operating_hours_updated_at BEFORE UPDATE ON operating_hours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE operating_hours IS 'Regular weekly operating hours per location';
```

**Validation Rules**:
- One record per day of week per location
- Either `is_closed = true` OR both times must be set
- Closing time validation: Can be earlier than opening (for overnight hours like 22:00 - 02:00)
- Application layer handles overnight closing (stored as next-day closing)

**Example Data**:
```sql
-- Monday: 11:00 AM - 10:00 PM
INSERT INTO operating_hours (location_id, tenant_id, day_of_week, opening_time, closing_time, is_closed)
VALUES ('...', '...', 1, '11:00:00', '22:00:00', false);

-- Sunday: Closed
INSERT INTO operating_hours (location_id, tenant_id, day_of_week, is_closed)
VALUES ('...', '...', 0, true);
```

---

### 5. SpecialHours Table

**Purpose**: Exceptions to regular hours (holidays, events, temporary closures)

```sql
CREATE TABLE special_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL,
    tenant_id UUID NOT NULL,  -- Denormalized for RLS

    -- Date of exception
    date DATE NOT NULL,

    -- Override times (NULL if closed all day)
    opening_time TIME,
    closing_time TIME,

    -- Reason/description
    reason VARCHAR(255) NOT NULL,

    -- Override type
    override_type VARCHAR(20) NOT NULL CHECK (override_type IN ('holiday', 'event', 'temporary_closure', 'special_event')),

    -- Closed flag
    is_closed BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT fk_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    CONSTRAINT unique_date_per_location UNIQUE (location_id, date),
    CONSTRAINT valid_special_hours CHECK (
        is_closed = true OR
        (opening_time IS NOT NULL AND closing_time IS NOT NULL)
    )
);

-- Enable RLS
ALTER TABLE special_hours ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY tenant_isolation_policy ON special_hours
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- Indexes
CREATE INDEX idx_special_hours_tenant_id ON special_hours(tenant_id);
CREATE INDEX idx_special_hours_location_id ON special_hours(location_id);
CREATE INDEX idx_special_hours_date ON special_hours(date);
CREATE INDEX idx_special_hours_future ON special_hours(date) WHERE date >= CURRENT_DATE;

-- Update trigger
CREATE TRIGGER update_special_hours_updated_at BEFORE UPDATE ON special_hours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE special_hours IS 'Special hours exceptions for holidays and events';
```

**Validation Rules**:
- One override per date per location
- Reason required (max 255 characters)
- Special hours override regular operating hours
- Application layer deletes past special hours (retention: 90 days for reporting)

**Example Data**:
```sql
-- Thanksgiving: Closed all day
INSERT INTO special_hours (location_id, tenant_id, date, reason, override_type, is_closed)
VALUES ('...', '...', '2025-11-27', 'Thanksgiving Holiday', 'holiday', true);

-- New Year's Eve: Special hours 11 AM - 8 PM
INSERT INTO special_hours (location_id, tenant_id, date, opening_time, closing_time, reason, override_type, is_closed)
VALUES ('...', '...', '2025-12-31', '11:00:00', '20:00:00', 'New Year''s Eve Early Closing', 'holiday', false);
```

---

### 6. ActivationCodes Table

**Purpose**: One-time codes for restaurant onboarding

```sql
CREATE TABLE activation_codes (
    code VARCHAR(20) PRIMARY KEY,  -- e.g., "ABCD-EF12-GH34"
    tenant_id UUID,  -- NULL until used, then references public.tenants
    email VARCHAR(255) NOT NULL,  -- Intended recipient

    -- Lifecycle
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expiration_date TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired', 'revoked')),

    -- Metadata
    generated_by UUID,  -- Admin user who generated
    deployment_type VARCHAR(20) NOT NULL DEFAULT 'shared' CHECK (deployment_type IN ('shared', 'dedicated')),

    -- Constraints
    CONSTRAINT valid_code_format CHECK (code ~ '^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT used_requires_tenant CHECK (status != 'used' OR tenant_id IS NOT NULL),
    CONSTRAINT expiration_after_generation CHECK (expiration_date > generated_at)
);

-- Indexes
CREATE INDEX idx_activation_codes_email ON activation_codes(email);
CREATE INDEX idx_activation_codes_status ON activation_codes(status);
CREATE INDEX idx_activation_codes_expiration ON activation_codes(expiration_date) WHERE status = 'pending';
CREATE INDEX idx_activation_codes_tenant ON activation_codes(tenant_id) WHERE tenant_id IS NOT NULL;

-- Auto-expire function
CREATE OR REPLACE FUNCTION expire_old_activation_codes()
RETURNS void AS $$
BEGIN
    UPDATE activation_codes
    SET status = 'expired'
    WHERE status = 'pending'
      AND expiration_date < now();
END;
$$ LANGUAGE plpgsql;

-- Scheduled job (requires pg_cron or application scheduler)
-- SELECT cron.schedule('expire-codes', '0 * * * *', 'SELECT expire_old_activation_codes()');

-- Comment
COMMENT ON TABLE activation_codes IS 'One-time activation codes for restaurant onboarding';
```

**Validation Rules**:
- Code format: `XXXX-XXXX-XXXX` (12 chars, uppercase alphanumeric, no ambiguous chars)
- Code must be unique (primary key)
- Email required (recipient identifier)
- Expiration date: 30 days for SMB, 90 days for enterprise (FR-008)
- Status transitions: `pending` → `used` or `expired` or `revoked`
- Once used, cannot be reused (immutable)

**State Transitions**:
```plaintext
pending ──(validate & use)──> used
   │
   ├──(expiration_date passed)──> expired
   │
   └──(admin action)──> revoked
```

---

### 7. TenantSettings Table

**Purpose**: Enterprise tenant-level configuration

```sql
CREATE TABLE tenant_settings (
    tenant_id UUID PRIMARY KEY,

    -- Geographic & compliance
    region VARCHAR(50) NOT NULL DEFAULT 'us-east-1',  -- Deployment region
    compliance_requirements JSONB DEFAULT '[]'::jsonb,  -- e.g., ["PCI_DSS", "GDPR_EU", "CCPA"]

    -- API quotas
    api_quota_limits JSONB DEFAULT '{
        "requests_per_minute": 1000,
        "locations_max": 100,
        "users_max": 50
    }'::jsonb,

    -- Custom configuration
    custom_config JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT valid_compliance_array CHECK (jsonb_typeof(compliance_requirements) = 'array'),
    CONSTRAINT valid_quota_limits CHECK (
        jsonb_typeof(api_quota_limits) = 'object' AND
        api_quota_limits ? 'requests_per_minute'
    )
);

-- Update trigger
CREATE TRIGGER update_tenant_settings_updated_at BEFORE UPDATE ON tenant_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE tenant_settings IS 'Enterprise tenant-level configuration and quotas';
```

**Validation Rules**:
- One settings record per tenant
- Compliance requirements: Array of valid compliance codes
- API quotas: Positive integers
- Custom config: Valid JSON object

**Example Data**:
```json
{
  "compliance_requirements": ["PCI_DSS", "SOC2_TYPE2"],
  "api_quota_limits": {
    "requests_per_minute": 5000,
    "locations_max": 20000,
    "users_max": 500
  },
  "custom_config": {
    "data_retention_days": 2555,
    "backup_frequency": "hourly",
    "enable_audit_log": true
  }
}
```

---

## Provisioning Requests Table

**Purpose**: Track enterprise tenant provisioning workflow

```sql
CREATE TABLE public.provisioning_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_slug VARCHAR(100) NOT NULL,
    tenant_name VARCHAR(255) NOT NULL,
    deployment_type VARCHAR(20) NOT NULL CHECK (deployment_type IN ('shared', 'dedicated')),
    region VARCHAR(50) NOT NULL DEFAULT 'us-east-1',
    compliance_requirements JSONB DEFAULT '[]'::jsonb,
    contract_reference VARCHAR(255),

    -- Workflow
    requested_by UUID NOT NULL,  -- Admin user
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'provisioning', 'provisioned_pending_review', 'active', 'failed', 'cancelled')
    ),

    provisioned_at TIMESTAMPTZ,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    error_log TEXT,

    -- Configuration
    configuration JSONB DEFAULT '{}'::jsonb,

    -- Constraints
    CONSTRAINT provisioned_requires_timestamp CHECK (
        status NOT IN ('provisioned_pending_review', 'active') OR provisioned_at IS NOT NULL
    ),
    CONSTRAINT active_requires_review CHECK (
        status != 'active' OR reviewed_at IS NOT NULL
    )
);

-- Indexes
CREATE INDEX idx_provisioning_requests_status ON public.provisioning_requests(status);
CREATE INDEX idx_provisioning_requests_requested_at ON public.provisioning_requests(requested_at);
CREATE INDEX idx_provisioning_requests_slug ON public.provisioning_requests(tenant_slug);

-- Comment
COMMENT ON TABLE public.provisioning_requests IS 'Enterprise tenant provisioning workflow tracking';
```

---

## Indexes Summary

### Performance Considerations

**RLS Queries** (Critical for shared multi-tenant):
- All tables with `tenant_id`: B-tree index for RLS policy filtering
- Composite indexes for common query patterns (tenant_id + status, tenant_id + slug)

**Lookup Patterns**:
- Slug lookups: Case-insensitive unique index on tenants.slug
- Date range queries: Index on special_hours.date for future dates only (partial index)
- Geographic queries: GiST index on locations coordinates (if delivery zones implemented)

**Query Performance Targets** (from research.md):
- Tenant isolation queries: <10ms (single-row lookup by tenant_id)
- Location listing: <50ms (10-20 locations per tenant average)
- Hours calculation: <20ms (7 days operating hours + special hours)

---

## Validation Rules Summary

### Database-Level Validation

| Entity | Rule | Enforcement |
|--------|------|-------------|
| Tenants | Slug format (lowercase, alphanumeric, hyphens) | CHECK constraint + regex |
| Tenants | Unique slug (case-insensitive) | UNIQUE index on LOWER(slug) |
| Restaurants | Unique name per tenant | UNIQUE constraint (tenant_id, name) |
| Restaurants | Valid email format | CHECK constraint + regex |
| Locations | Valid timezone (IANA) | CHECK constraint (subset of timezones) |
| Locations | Coordinates range | CHECK constraint (lat/lon bounds) |
| OperatingHours | One record per day per location | UNIQUE constraint (location_id, day_of_week) |
| OperatingHours | Valid time range | CHECK constraint (is_closed OR times set) |
| SpecialHours | One override per date per location | UNIQUE constraint (location_id, date) |
| ActivationCodes | Code format (XXXX-XXXX-XXXX) | CHECK constraint + regex |
| ActivationCodes | Status transitions | CHECK constraint (used requires tenant_id) |

### Application-Level Validation

| Entity | Rule | Enforcement |
|--------|------|-------------|
| Restaurants | Logo file size ≤ 2MB | FastAPI file upload validation |
| Restaurants | Valid hex color codes | Pydantic regex validator |
| Restaurants | Welcome message ≤ 500 chars | Pydantic max_length validator |
| Locations | Phone number E.164 format | Pydantic validator |
| Locations | Primary location per restaurant | Business logic (unique flag) |
| OperatingHours | Overnight hours handling | Business logic (next-day conversion) |
| ActivationCodes | Ambiguous char removal | Code generation function |

---

## State Transitions

### Activation Code Lifecycle

```plaintext
┌─────────┐
│ pending │
└────┬────┘
     │
     ├──(validate successfully)──> ┌──────┐
     │                              │ used │
     │                              └──────┘
     │
     ├──(expiration_date reached)──> ┌─────────┐
     │                                │ expired │
     │                                └─────────┘
     │
     └──(admin revokes)──> ┌─────────┐
                           │ revoked │
                           └─────────┘
```

**Transitions**:
- `pending` → `used`: User validates code during onboarding (FR-002)
- `pending` → `expired`: Automated job runs hourly, expires codes past expiration_date
- `pending` → `revoked`: Admin manually revokes code (e.g., employee no longer valid)
- All transitions immutable (no reversals)

### Location Status Lifecycle

```plaintext
┌────────┐
│ active │
└───┬────┘
    │
    ├──(owner deactivates)──> ┌──────────┐
    │                          │ inactive │◄──(owner reactivates)──┐
    │                          └──────────┘                        │
    │                                                               │
    └──(owner permanently closes)──> ┌────────────────────┐        │
                                      │ permanently_closed │────────┘
                                      └────────────────────┘
                                      (no reactivation)
```

**Transitions**:
- `active` → `inactive`: Temporary closure (can reactivate)
- `inactive` → `active`: Reactivation after temporary closure
- `active` → `permanently_closed`: Irreversible closure (data archived)
- `permanently_closed`: Terminal state (FR-021, FR-022)

### Restaurant Status Lifecycle

```plaintext
┌───────────────┐
│ pending_setup │
└───────┬───────┘
        │
        ├──(onboarding complete)──> ┌────────┐
        │                            │ active │
        │                            └───┬────┘
        │                                │
        │                                ├──(policy violation)──> ┌───────────┐
        │                                │                         │ suspended │
        │                                │                         └─────┬─────┘
        │                                │                               │
        │                                │                               └──(appeal approved)──> active
        │                                │
        │                                └──(owner closes)──> ┌────────┐
        │                                                      │ closed │
        │                                                      └────────┘
        └──(activation code expired)──> expired (not shown in main flow)
```

**Transitions**:
- `pending_setup` → `active`: Onboarding wizard completed
- `active` → `suspended`: Platform admin action (policy violation)
- `suspended` → `active`: Admin reinstates after issue resolution
- `active` → `closed`: Owner permanently closes restaurant
- `closed`: Terminal state (data retained for historical reporting)

### Provisioning Request Workflow

```plaintext
┌─────────┐
│ pending │
└────┬────┘
     │
     ├──(script starts)──> ┌──────────────┐
     │                      │ provisioning │
     │                      └──────┬───────┘
     │                             │
     │                             ├──(success)──> ┌───────────────────────────┐
     │                             │                │ provisioned_pending_review│
     │                             │                └────────────┬──────────────┘
     │                             │                             │
     │                             │                             ├──(admin approves)──> ┌────────┐
     │                             │                             │                       │ active │
     │                             │                             │                       └────────┘
     │                             │                             │
     │                             │                             └──(admin rejects)──> cancelled
     │                             │
     │                             └──(error)──> ┌────────┐
     │                                            │ failed │
     │                                            └────────┘
     │
     └──(admin cancels)──> ┌───────────┐
                           │ cancelled │
                           └───────────┘
```

**Transitions**:
- `pending` → `provisioning`: Automated provisioning service picks up request
- `provisioning` → `provisioned_pending_review`: Schema created, awaiting review
- `provisioned_pending_review` → `active`: Admin approves, tenant goes live
- `provisioning` → `failed`: Error during provisioning (logged, alerting triggered)
- Any non-terminal → `cancelled`: Admin cancels request

---

## RLS Policy Examples

### Query Behavior with RLS

**Set Tenant Context** (Middleware):
```sql
-- Set session variable at request start
SET app.current_tenant = '7f3e8b2a-4c91-4d8e-9f1a-2b3c4d5e6f7g';
```

**Query with RLS Enforcement**:
```sql
-- User queries: SELECT * FROM restaurants;
-- PostgreSQL executes:
SELECT * FROM restaurants
WHERE tenant_id = current_setting('app.current_tenant')::UUID;
-- Returns only rows for tenant '7f3e8b2a-...'
```

**Insert with RLS**:
```sql
-- User inserts: INSERT INTO restaurants (name, ...) VALUES ('New Restaurant', ...);
-- RLS policy enforces tenant_id must match current_setting
INSERT INTO restaurants (tenant_id, name, ...)
VALUES (current_setting('app.current_tenant')::UUID, 'New Restaurant', ...);
```

### Testing RLS Isolation

```sql
-- Test script for tenant isolation
DO $$
DECLARE
    tenant1 UUID := gen_random_uuid();
    tenant2 UUID := gen_random_uuid();
    count1 INT;
    count2 INT;
BEGIN
    -- Insert test data for tenant1
    PERFORM set_config('app.current_tenant', tenant1::TEXT, false);
    INSERT INTO restaurants (tenant_id, name, contact_email)
    VALUES (tenant1, 'Tenant1 Restaurant', 'contact@tenant1.com');

    -- Insert test data for tenant2
    PERFORM set_config('app.current_tenant', tenant2::TEXT, false);
    INSERT INTO restaurants (tenant_id, name, contact_email)
    VALUES (tenant2, 'Tenant2 Restaurant', 'contact@tenant2.com');

    -- Verify isolation: tenant1 sees only their data
    PERFORM set_config('app.current_tenant', tenant1::TEXT, false);
    SELECT COUNT(*) INTO count1 FROM restaurants;
    ASSERT count1 = 1, 'Tenant1 should see exactly 1 restaurant';

    -- Verify isolation: tenant2 sees only their data
    PERFORM set_config('app.current_tenant', tenant2::TEXT, false);
    SELECT COUNT(*) INTO count2 FROM restaurants;
    ASSERT count2 = 1, 'Tenant2 should see exactly 1 restaurant';

    RAISE NOTICE 'RLS isolation test PASSED';
END $$;
```

---

## Migration Strategy

### Initial Schema Setup (MVP)

```sql
-- migrations/001_create_base_schema.sql
-- Run order:
-- 1. Create public.tenants (metadata)
-- 2. Create shared schema tables (restaurants, locations, etc.)
-- 3. Enable RLS on all tenant-scoped tables
-- 4. Create indexes
-- 5. Seed reserved slugs and test data
```

### Enterprise Schema Provisioning

```sql
-- scripts/provision_enterprise_schema.sql
-- Template for creating dedicated tenant schemas
-- Usage: psql -v tenant_slug=acme -f provision_enterprise_schema.sql

CREATE SCHEMA tenant_:tenant_slug AUTHORIZATION parcera_app;
SET search_path TO tenant_:tenant_slug, public;

-- Run all table creation scripts (without RLS, since schema-isolated)
\i migrations/tables/restaurants.sql
\i migrations/tables/locations.sql
\i migrations/tables/operating_hours.sql
\i migrations/tables/special_hours.sql
\i migrations/tables/activation_codes.sql
\i migrations/tables/tenant_settings.sql

-- Register in metadata
INSERT INTO public.tenants (slug, name, deployment_type, schema_name)
VALUES (:'tenant_slug', 'Enterprise Tenant', 'dedicated', 'tenant_' || :'tenant_slug');
```

### Schema Evolution

**Version Tracking**:
```sql
CREATE TABLE public.schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    schema_name VARCHAR(100),  -- NULL for shared, 'tenant_<slug>' for dedicated
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    execution_time_ms INT
);
```

**Migration Runner** (Pseudocode):
```python
def apply_migration(migration_file: str, schema_name: str = None):
    """Apply migration to shared or dedicated schema"""
    if schema_name:
        # Dedicated tenant schema
        execute_sql(f"SET search_path TO {schema_name}, public")
    else:
        # Shared schema
        execute_sql("SET search_path TO public")

    start_time = time.now()
    execute_sql_file(migration_file)
    execution_time = (time.now() - start_time).milliseconds

    # Record migration
    record_migration(migration_file, schema_name, execution_time)
```

---

## Performance Optimization

### Denormalization Strategy

**Tenant ID Denormalization**:
- `locations.tenant_id`: Denormalized from `restaurants.tenant_id` for RLS performance
- Avoids JOIN in every RLS policy evaluation
- Trade-off: Slight data redundancy for 10x query performance improvement

**Index Strategy**:
- Single-column indexes: `tenant_id`, `status`, `day_of_week`
- Composite indexes: `(tenant_id, slug)`, `(location_id, day_of_week)`
- Partial indexes: `special_hours.date WHERE date >= CURRENT_DATE` (future dates only)

### Query Performance Targets

| Query Type | Target Latency | Index Used |
|------------|----------------|------------|
| List restaurants for tenant | <10ms | idx_restaurants_tenant_id |
| Get location by slug | <5ms | idx_locations_slug |
| Check if location open now | <20ms | idx_operating_hours_location_id + idx_special_hours_future |
| Validate activation code | <15ms | PRIMARY KEY (activation_codes.code) |
| List locations for restaurant | <30ms | idx_locations_restaurant_id |

---

## Backup & Disaster Recovery

### Backup Strategy

**Shared Multi-Tenant** (RLS tables):
- Full database backup: Daily at 2 AM UTC
- Point-in-time recovery: Enabled (WAL archiving)
- Retention: 30 days for production, 7 days for staging

**Dedicated Enterprise Schemas**:
- Per-schema backup: Daily at 3 AM UTC (staggered)
- Independent restore: Schema-level restore without affecting others
- Retention: Custom per tenant (90 days default, configurable)

### Data Retention

| Entity | Retention Policy |
|--------|------------------|
| Restaurants (active) | Indefinite |
| Restaurants (closed) | 7 years (audit compliance) |
| Locations (active/inactive) | Indefinite |
| Locations (permanently_closed) | 2 years |
| OperatingHours | Indefinite (current schedule) |
| SpecialHours (past) | 90 days |
| ActivationCodes (used) | 1 year |
| ActivationCodes (expired) | 90 days |

---

## Security Considerations

### SQL Injection Prevention

- **Parameterized Queries**: All application queries use parameter binding
- **RLS Policy Isolation**: Session variables set via application middleware (not user input)
- **Input Validation**: Pydantic models validate all inputs before database interaction

### Tenant Data Isolation

**RLS Enforcement**:
- All tenant-scoped tables have RLS enabled
- Policies enforce `tenant_id = current_setting('app.current_tenant')`
- Database role `parcera_app` has no BYPASSRLS privilege

**Audit Logging** (Future):
- `pgaudit` extension for compliance
- Log all queries accessing tenant data
- Alert on cross-tenant query attempts (should never occur with RLS)

### Encryption

- **At Rest**: PostgreSQL Transparent Data Encryption (TDE) or filesystem-level encryption
- **In Transit**: TLS 1.3 for all database connections
- **Application-Level**: Sensitive fields (e.g., email) can be encrypted with application keys (future enhancement)

---

## Appendix: Complete Schema Creation Script

```sql
-- Full schema creation script for Multi-tenant Restaurant Management
-- PostgreSQL 14+
-- Execution time: ~5 seconds

BEGIN;

-- ============================================================
-- STEP 1: Public Schema (Metadata)
-- ============================================================

-- Tenants table (central registry)
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    deployment_type VARCHAR(20) NOT NULL CHECK (deployment_type IN ('shared', 'dedicated')),
    schema_name VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT schema_name_required_for_dedicated
        CHECK (deployment_type = 'shared' OR schema_name IS NOT NULL)
);

CREATE UNIQUE INDEX idx_tenants_slug ON public.tenants(LOWER(slug));
CREATE INDEX idx_tenants_deployment_type ON public.tenants(deployment_type);

-- Reserved slugs
CREATE TABLE public.reserved_slugs (
    slug VARCHAR(100) PRIMARY KEY,
    reserved_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.reserved_slugs (slug, reserved_by) VALUES
    ('admin', 'platform'), ('api', 'platform'), ('www', 'platform'),
    ('app', 'platform'), ('dashboard', 'platform'), ('business', 'platform');

-- Provisioning requests
CREATE TABLE public.provisioning_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_slug VARCHAR(100) NOT NULL,
    tenant_name VARCHAR(255) NOT NULL,
    deployment_type VARCHAR(20) NOT NULL,
    region VARCHAR(50) NOT NULL DEFAULT 'us-east-1',
    compliance_requirements JSONB DEFAULT '[]'::jsonb,
    requested_by UUID NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    provisioned_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    configuration JSONB DEFAULT '{}'::jsonb
);

-- ============================================================
-- STEP 2: Shared Schema Tables (RLS-enabled)
-- ============================================================

-- Helper function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Restaurants
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cuisine_type VARCHAR(100),
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    branding_config JSONB DEFAULT '{"logo_url": null, "primary_color": "#000000"}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_restaurant_name_per_tenant UNIQUE (tenant_id, name)
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON restaurants
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

CREATE INDEX idx_restaurants_tenant_id ON restaurants(tenant_id);

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Locations
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    slug VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(2) NOT NULL DEFAULT 'US',
    phone VARCHAR(20),
    email VARCHAR(255),
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_location_slug_per_tenant UNIQUE (tenant_id, slug)
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON locations
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

CREATE INDEX idx_locations_tenant_id ON locations(tenant_id);
CREATE INDEX idx_locations_restaurant_id ON locations(restaurant_id);

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Operating Hours
CREATE TABLE operating_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    opening_time TIME,
    closing_time TIME,
    is_closed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_day_per_location UNIQUE (location_id, day_of_week)
);

ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON operating_hours
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

CREATE INDEX idx_operating_hours_location_id ON operating_hours(location_id);

-- Special Hours
CREATE TABLE special_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    date DATE NOT NULL,
    opening_time TIME,
    closing_time TIME,
    reason VARCHAR(255) NOT NULL,
    override_type VARCHAR(20) NOT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_date_per_location UNIQUE (location_id, date)
);

ALTER TABLE special_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON special_hours
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

CREATE INDEX idx_special_hours_location_id ON special_hours(location_id);
CREATE INDEX idx_special_hours_date ON special_hours(date);

-- Activation Codes
CREATE TABLE activation_codes (
    code VARCHAR(20) PRIMARY KEY,
    tenant_id UUID,
    email VARCHAR(255) NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expiration_date TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    deployment_type VARCHAR(20) NOT NULL DEFAULT 'shared',

    CONSTRAINT valid_code_format CHECK (code ~ '^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$')
);

CREATE INDEX idx_activation_codes_status ON activation_codes(status);
CREATE INDEX idx_activation_codes_email ON activation_codes(email);

-- Tenant Settings
CREATE TABLE tenant_settings (
    tenant_id UUID PRIMARY KEY,
    region VARCHAR(50) NOT NULL DEFAULT 'us-east-1',
    compliance_requirements JSONB DEFAULT '[]'::jsonb,
    api_quota_limits JSONB DEFAULT '{"requests_per_minute": 1000}'::jsonb,
    custom_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
```

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-11-03 | System | Initial data model specification |

---

**End of Data Model Specification**
