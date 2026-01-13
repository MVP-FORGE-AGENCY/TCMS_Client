# Database and Migration Specification

## Overview

TCMS uses PostgreSQL 15+ via Supabase as its primary database. The database schema is designed for multi-tenancy, compliance tracking, and auditability. All schema changes are managed through SQL migration files.

## Database Architecture

### Database Provider: Supabase

- **PostgreSQL Version**: 15+
- **Connection**: Via Supabase client library
- **Connection Pooling**: Handled by Supabase
- **Backups**: Automatic daily backups
- **Point-in-Time Recovery**: Available

### Multi-Tenancy Model

- **Organization Isolation**: All primary tables include `organisation_id`
- **Row Level Security (RLS)**: Enforced at database level
- **Data Segregation**: Users can only access data from their organization

## Schema Overview

### Core Tables

#### Organizations
```sql
organisations
├── id (UUID, PK)
├── name (VARCHAR)
├── code (VARCHAR, UNIQUE)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

#### Users
```sql
users
├── id (UUID, PK)
├── auth_id (UUID, FK → auth.users)
├── organisation_id (UUID, FK → organisations)
├── full_name (VARCHAR)
├── email (VARCHAR, UNIQUE)
├── role (VARCHAR) -- super_admin, org_admin, training_manager, instructor, assessor, employee
├── is_active (BOOLEAN)
├── employment_start (DATE)
└── created_at, updated_at (TIMESTAMPTZ)
```

#### Training Programmes
```sql
training_programmes
├── id (UUID, PK)
├── organisation_id (UUID, FK)
├── code (VARCHAR)
├── name (VARCHAR)
├── type (VARCHAR) -- initial, recurrent, conversion
├── validity_months (INTEGER)
├── pass_score_percent (INTEGER)
├── theory_hours (DECIMAL)
├── practical_hours (DECIMAL)
├── is_active (BOOLEAN)
└── created_at, updated_at (TIMESTAMPTZ)
```

#### Training Sessions
```sql
training_sessions
├── id (UUID, PK)
├── programme_id (UUID, FK → training_programmes)
├── date_start (DATE)
├── date_end (DATE)
├── instructor_id (UUID, FK → users)
├── status (VARCHAR) -- scheduled, in_progress, completed, cancelled
├── is_retake (BOOLEAN)
├── original_session_id (UUID, FK → training_sessions)
└── created_at, updated_at (TIMESTAMPTZ)
```

#### Session Results
```sql
session_results
├── id (UUID, PK)
├── session_id (UUID, FK → training_sessions)
├── user_id (UUID, FK → users)
├── result (VARCHAR) -- pass, fail
├── grade (INTEGER) -- 1-5 scale
├── signature_data (TEXT) -- JSON signature data
├── signed_at (TIMESTAMPTZ)
└── created_at, updated_at (TIMESTAMPTZ)
```

#### Proficiency Profiles
```sql
proficiency_profiles
├── id (UUID, PK)
├── organisation_id (UUID, FK)
├── code (VARCHAR)
├── name (VARCHAR)
├── interval_months (INTEGER)
├── grading_schema (JSONB) -- AQP, EBT, or standard schema
├── is_active (BOOLEAN)
└── created_at, updated_at (TIMESTAMPTZ)
```

#### Proficiency Checks
```sql
proficiency_checks
├── id (UUID, PK)
├── trainee_id (UUID, FK → users)
├── profile_id (UUID, FK → proficiency_profiles)
├── assessor_id (UUID, FK → users)
├── date_start (TIMESTAMPTZ)
├── date_end (TIMESTAMPTZ)
├── result (VARCHAR) -- pass, fail, pending
├── attempt_number (INTEGER)
├── is_finalized (BOOLEAN)
├── elements_results (JSONB) -- Detailed grading per element
└── created_at, updated_at (TIMESTAMPTZ)
```

#### Check Assessor Evaluations
```sql
check_assessor_evaluations
├── id (UUID, PK)
├── check_id (UUID, FK → proficiency_checks)
├── assessor_id (UUID, FK → users)
├── elements_results (JSONB)
├── result (VARCHAR) -- pass, fail
├── signature_data (TEXT)
├── signed_at (TIMESTAMPTZ)
├── comments (TEXT)
└── created_at, updated_at (TIMESTAMPTZ)
```

#### User Competences
```sql
user_competences
├── id (UUID, PK)
├── user_id (UUID, FK → users)
├── programme_id (UUID, FK → training_programmes, nullable)
├── profile_id (UUID, FK → proficiency_profiles, nullable)
├── valid_until (TIMESTAMPTZ)
├── status (ENUM) -- valid, expiring_soon, expired, not_acquired
├── source_type (VARCHAR) -- training, proficiency_check
├── source_id (UUID) -- Reference to session_result or proficiency_check
└── created_at, updated_at (TIMESTAMPTZ)
```

#### Audit Log
```sql
audit_log
├── id (UUID, PK)
├── user_id (UUID, FK → users, nullable)
├── action (VARCHAR) -- CREATE, UPDATE, DELETE, etc.
├── entity (VARCHAR) -- Table name
├── entity_id (UUID)
├── old_values (JSONB)
├── new_values (JSONB)
├── ip_address (INET)
├── user_agent (TEXT)
└── created_at (TIMESTAMPTZ)
```

### Supporting Tables

- `organisation_settings` - Configurable thresholds per organization
- `training_materials` - Versioned training materials with approval workflow
- `absences` - Employee absence tracking
- `standards` - Regulatory standards (EASA, etc.) with versioning
- `documents` - Document storage references
- `signature_protocol` - Detailed signature metadata for non-repudiation

## Row Level Security (RLS)

### RLS Policy Pattern

All tables with `organisation_id` have RLS policies enforcing organization isolation:

```sql
-- Example RLS policy
CREATE POLICY "Users can only see their organization's data"
ON table_name
FOR SELECT
USING (organisation_id = (SELECT organisation_id FROM users WHERE auth_id = auth.uid()));
```

### RLS Enforcement Points

1. **SELECT**: Users can only read data from their organization
2. **INSERT**: New records automatically assigned user's organization_id
3. **UPDATE**: Users can only update records from their organization
4. **DELETE**: Users can only delete records from their organization

### Service Role Bypass

- Backend uses `SUPABASE_SERVICE_KEY` (service role) to bypass RLS
- Service role has full database access
- Application logic enforces organization isolation at API level

## Indexes

### Performance Indexes

```sql
-- User lookups
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_organisation ON users(organisation_id);
CREATE INDEX idx_users_email ON users(email);

-- Training queries
CREATE INDEX idx_sessions_programme ON training_sessions(programme_id);
CREATE INDEX idx_sessions_instructor ON training_sessions(instructor_id);
CREATE INDEX idx_sessions_dates ON training_sessions(date_start, date_end);
CREATE INDEX idx_results_user ON session_results(user_id);
CREATE INDEX idx_results_session ON session_results(session_id);

-- Competence tracking
CREATE INDEX idx_competences_user ON user_competences(user_id);
CREATE INDEX idx_competences_status ON user_competences(status);
CREATE INDEX idx_competences_valid_until ON user_competences(valid_until);

-- Proficiency checks
CREATE INDEX idx_checks_trainee ON proficiency_checks(trainee_id);
CREATE INDEX idx_checks_assessor ON proficiency_checks(assessor_id);
CREATE INDEX idx_checks_profile ON proficiency_checks(profile_id);
CREATE INDEX idx_checks_result ON proficiency_checks(result);
```

### Composite Indexes

```sql
-- Common query patterns
CREATE INDEX idx_competences_user_status ON user_competences(user_id, status);
CREATE INDEX idx_sessions_org_status ON training_sessions(organisation_id, status);
```

## Database Functions and Stored Procedures

### Competence Status Calculation

```sql
CREATE FUNCTION calculate_competence_status_val(valid_until_date TIMESTAMPTZ)
RETURNS competence_status AS $$
BEGIN
    IF valid_until_date IS NULL THEN
        RETURN 'not_acquired';
    ELSIF valid_until_date < NOW() THEN
        RETURN 'expired';
    ELSIF valid_until_date <= (NOW() + INTERVAL '90 days') THEN
        RETURN 'expiring_soon';
    ELSE
        RETURN 'valid';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Traffic Light Dashboard Aggregation

```sql
CREATE FUNCTION get_traffic_light_dashboard(org_id UUID)
RETURNS TABLE (
    user_id UUID,
    green_count INTEGER,
    amber_count INTEGER,
    red_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uc.user_id,
        COUNT(*) FILTER (WHERE uc.status = 'valid')::INTEGER as green_count,
        COUNT(*) FILTER (WHERE uc.status = 'expiring_soon')::INTEGER as amber_count,
        COUNT(*) FILTER (WHERE uc.status = 'expired')::INTEGER as red_count
    FROM user_competences uc
    JOIN users u ON uc.user_id = u.id
    WHERE u.organisation_id = org_id
    GROUP BY uc.user_id;
END;
$$ LANGUAGE plpgsql;
```

### Audit Triggers

Automatic audit logging via triggers:

```sql
CREATE TRIGGER audit_training_sessions
AFTER INSERT OR UPDATE OR DELETE ON training_sessions
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

## Migration Strategy

### Migration File Naming

Migrations are numbered sequentially:
```
001_initial_schema.sql
002_standards_materials_checks.sql
003_session_signatures.sql
...
023_storage_and_reports.sql
```

### Migration Execution

1. **Development**: Run migrations manually in Supabase SQL Editor
2. **Production**: Migrations should be reviewed and executed via:
   - Supabase Dashboard SQL Editor (manual)
   - Supabase CLI (automated)
   - Migration script runner (custom)

### Migration Best Practices

1. **Idempotency**: All migrations should be idempotent (safe to run multiple times)
   ```sql
   -- Use IF NOT EXISTS, DO $$ blocks
   CREATE TABLE IF NOT EXISTS ...
   
   DO $$
   BEGIN
       IF NOT EXISTS (SELECT 1 FROM ...) THEN
           ALTER TABLE ... ADD COLUMN ...;
       END IF;
   END $$;
   ```

2. **Backward Compatibility**: Avoid breaking changes in migrations
   - Add new columns as nullable first
   - Migrate data before adding constraints
   - Deprecate old columns before removing

3. **Data Migrations**: Separate schema changes from data migrations
   - Schema migration: Add column
   - Data migration: Populate column values
   - Constraint migration: Add NOT NULL constraint

4. **Rollback Strategy**: Document rollback procedures for each migration
   ```sql
   -- Rollback script (stored separately or in comments)
   -- ALTER TABLE table_name DROP COLUMN column_name;
   ```

### Migration Checklist

- [ ] Migration is idempotent
- [ ] Migration includes indexes for new columns
- [ ] Migration updates RLS policies if needed
- [ ] Migration includes data migration if applicable
- [ ] Migration tested in development environment
- [ ] Rollback procedure documented
- [ ] Migration does not lock tables for extended periods

## Database Maintenance

### Regular Maintenance Tasks

1. **Vacuum and Analyze**
   ```sql
   VACUUM ANALYZE;
   ```
   - Run weekly or after large data changes
   - Supabase handles this automatically, but can be run manually

2. **Index Maintenance**
   - Monitor index usage via `pg_stat_user_indexes`
   - Remove unused indexes
   - Add indexes for slow queries

3. **Statistics Updates**
   ```sql
   ANALYZE table_name;
   ```
   - Update query planner statistics
   - Run after bulk data changes

### Performance Monitoring

**Key Metrics to Monitor:**
- Query execution time
- Connection pool usage
- Index hit ratio
- Table size growth
- Lock contention

**Supabase Dashboard:**
- Database performance metrics available in Supabase dashboard
- Query performance insights
- Connection pool monitoring

## Backup and Recovery

### Automatic Backups

- **Frequency**: Daily automatic backups
- **Retention**: 7 days (configurable in Supabase)
- **Point-in-Time Recovery**: Available for Pro plans

### Manual Backups

```bash
# Via Supabase CLI
supabase db dump -f backup.sql

# Via pg_dump (if direct access available)
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

### Restore Procedures

1. **Full Restore**: Restore entire database from backup
2. **Table Restore**: Restore specific table
3. **Point-in-Time Recovery**: Restore to specific timestamp

## Data Integrity

### Foreign Key Constraints

All relationships enforced via foreign keys:
```sql
ALTER TABLE training_sessions
ADD CONSTRAINT fk_sessions_programme
FOREIGN KEY (programme_id) REFERENCES training_programmes(id) ON DELETE CASCADE;
```

### Check Constraints

Data validation at database level:
```sql
ALTER TABLE session_results
ADD CONSTRAINT chk_result_values
CHECK (result IN ('pass', 'fail'));

ALTER TABLE proficiency_checks
ADD CONSTRAINT chk_attempt_number
CHECK (attempt_number >= 1 AND attempt_number <= 3);
```

### Unique Constraints

Prevent duplicate data:
```sql
ALTER TABLE users
ADD CONSTRAINT uq_users_email UNIQUE (email);

ALTER TABLE training_programmes
ADD CONSTRAINT uq_programmes_code_org UNIQUE (organisation_id, code);
```

## Security Considerations

### Database Access

- **Application Access**: Via Supabase client with service role key
- **Direct Access**: Restricted to authorized personnel only
- **Connection Encryption**: TLS/SSL required for all connections

### Sensitive Data

- **Passwords**: Stored in Supabase Auth (hashed, never in public schema)
- **Signatures**: Encrypted signature data stored in TEXT fields
- **Personal Data**: GDPR compliance considerations for EU data

### Audit Trail

- All critical operations logged in `audit_log` table
- Includes: user, action, timestamp, IP address, user agent
- Immutable audit trail (append-only)

## Migration History

### Current Migration Files

1. `001_initial_schema.sql` - Core schema setup
2. `002_standards_materials_checks.sql` - Standards and materials
3. `003_session_signatures.sql` - Digital signatures
4. `004_fail_retake.sql` - Retake workflow
5. `005_standards_versioning.sql` - Standards versioning
6. `006_fix_revision_type.sql` - Bug fix
7. `007_relax_code_constraint.sql` - Constraint adjustment
8. `008_ensure_material_columns.sql` - Material columns
9. `009_setup_storage.sql` - Storage buckets
10. `010_material_version_constraint.sql` - Version constraints
11. `011_programme_standard_constraint.sql` - Programme constraints
12. `012_session_execution.sql` - Session execution tracking
13. `013_documents_and_competence.sql` - Documents and competence
14. `014_storage_buckets.sql` - Storage configuration
15. `015_proficiency_checks.sql` - Proficiency checks schema
16. `016_checks_enhancements.sql` - Check enhancements
17. `017_advanced_grading.sql` - Advanced grading schemas
18. `018_signature_text.sql` - Signature text storage
19. `019_signature_protocol.sql` - Signature protocol metadata
20. `020_competence_engine.sql` - Competence status engine
21. `021_multi_tenant_onboarding.sql` - Multi-tenant setup
22. `022_traffic_light_dashboard.sql` - Dashboard functions
23. `023_storage_and_reports.sql` - Storage and reporting

### Migration Version Tracking

Track applied migrations in a `schema_migrations` table:
```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Development Guidelines

### Adding New Tables

1. Create migration file: `024_new_feature.sql`
2. Include:
   - Table creation with all columns
   - Indexes for foreign keys and common queries
   - RLS policies for organization isolation
   - Audit triggers if needed
3. Test migration in development
4. Document table purpose and relationships

### Modifying Existing Tables

1. Create migration file with descriptive name
2. Use `DO $$` blocks for conditional changes
3. Migrate existing data if needed
4. Add indexes for new columns
5. Update RLS policies if access patterns change

### Query Optimization

1. Use `EXPLAIN ANALYZE` to analyze query plans
2. Add indexes for slow queries
3. Avoid N+1 queries (use JOINs or batch queries)
4. Use database functions for complex calculations
