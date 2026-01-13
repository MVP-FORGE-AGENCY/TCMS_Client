# Security Specification

## Overview

TCMS implements a comprehensive, multi-layered security architecture designed to protect sensitive training and compliance data while ensuring regulatory compliance and auditability.

## 1. Authentication & Authorization

### Authentication Mechanism

**JWT-Based Authentication**
- **Provider**: Supabase Auth handles user authentication
- **Token Format**: JSON Web Tokens (JWT) with standard claims
- **Token Validation**: Every API request validates JWT token via middleware
- **Token Storage**: Frontend stores tokens in localStorage/sessionStorage
- **Token Expiry**: Tokens expire after configured period (default: 1 hour)
- **Refresh Tokens**: Automatic token refresh handled by Supabase

**Authentication Flow**
1. User submits credentials to Supabase Auth
2. Supabase validates credentials and returns JWT token
3. Frontend stores token and includes in API requests
4. Backend middleware validates token on each request
5. Backend loads user details from database
6. Request proceeds with authenticated user context

### Authorization - Role-Based Access Control (RBAC)

**Role Hierarchy**
```
super_admin (Level 100)
  └── org_admin (Level 90)
      └── training_manager (Level 80)
          ├── instructor (Level 60)
          └── assessor (Level 60)
              └── employee (Level 40)
```

**Role Definitions**
- **super_admin**: System-wide administration, organization management
- **org_admin**: Organization administration, user management within organization
- **training_manager**: Training programme and session management
- **instructor**: Training session delivery, grading, and signing
- **assessor**: Proficiency check assessment and grading
- **employee**: Self-service access to own records

**Authorization Enforcement**
- **Middleware-Level**: `requireRole()` and `requireMinRole()` middleware enforce permissions
- **Route-Level**: Routes protected by role-based middleware
- **Database-Level**: RLS policies enforce organization isolation
- **Application-Level**: Controllers validate user permissions before operations

**Permission Model**
- **Granular Permissions**: Role-based access to specific features
- **Context-Aware**: Permissions respect organization context
- **Hierarchical**: Higher roles inherit lower role permissions
- **Dynamic**: Permissions checked on every request

## 2. Data Security

### Row Level Security (RLS)

**Database-Level Security**
- **PostgreSQL RLS**: Policies enforce data access at database level
- **Organization Isolation**: Users can only access data from their organization
- **Bypass Protection**: Even direct database access respects RLS policies
- **Policy Enforcement**: Policies checked on every query

**RLS Policy Pattern**
```sql
-- Example RLS policy
CREATE POLICY "Users can only see their organization's data"
ON table_name
FOR SELECT
USING (
  organisation_id = (
    SELECT organisation_id 
    FROM users 
    WHERE auth_id = auth.uid()
  )
);
```

**RLS Coverage**
- All tables with `organisation_id` have RLS policies
- Policies enforce SELECT, INSERT, UPDATE, DELETE operations
- Service role key bypasses RLS (backend only, never exposed)

### Input Validation

**Frontend Validation**
- **Zod Schemas**: Type-safe validation schemas
- **React Hook Form**: Form-level validation
- **Real-Time Feedback**: Immediate validation feedback
- **Type Safety**: TypeScript ensures type correctness

**Backend Validation**
- **UUID Validation**: Regex validation for UUID parameters
- **Joi Schemas**: Request body validation schemas
- **Parameter Validation**: Route parameter validation middleware
- **Sanitization**: Input sanitization to prevent injection attacks

**Validation Layers**
1. **Client-Side**: Immediate feedback, better UX
2. **API-Level**: Server-side validation, security enforcement
3. **Database-Level**: Constraints and triggers for data integrity

### SQL Injection Prevention

**Parameterized Queries**
- Supabase client uses parameterized queries
- No string concatenation in SQL queries
- Prepared statements prevent SQL injection

**Best Practices**
- Always use Supabase client methods
- Never construct SQL strings manually
- Validate all inputs before database operations

### XSS Prevention

**Frontend Protection**
- React automatically escapes content
- No `dangerouslySetInnerHTML` usage
- Content Security Policy (CSP) headers

**Backend Protection**
- Helmet middleware sets security headers
- Content-Type validation
- Input sanitization

## 3. Digital Signatures & Non-Repudiation

### Signature Requirements

**Critical Actions Requiring Signatures**
- Training session result finalization
- Proficiency check finalization
- Grade changes after initial recording
- Document approvals

### Signature Methods

**Canvas Signature Pad**
- **Visual Capture**: Drawing canvas captures signature image
- **Tablet Support**: Optimized for tablet use
- **Natural Experience**: Mimics physical signing
- **Image Storage**: Signature stored as base64-encoded image

**PIN-Based Signatures** (Optional)
- Quick signing for low-risk operations
- PIN verification required
- Still captures metadata

### Signature Metadata

**Captured Information**
- Signature image/data
- IP address
- Timestamp (server-side)
- User agent
- Browser fingerprint (if available)

**Storage**
- `signature_data`: Signature image/data (TEXT)
- `signature_protocol`: Detailed metadata (separate table)
- Immutable records (append-only)

### Non-Repudiation

**Cryptographic Verification**
- Signature data includes cryptographic hash
- Timestamp from trusted server
- IP address and user agent for context
- Cannot be repudiated after signing

**Record Immutability**
- Signed records become read-only
- API logic prevents modifications
- Database triggers can enforce immutability
- Audit log records all attempts to modify

## 4. Multi-Tenancy Isolation

### Organization Isolation

**Hard Separation**
- All primary tables include `organisation_id`
- Foreign key constraints enforce relationships
- Queries filtered by organization_id
- No cross-organization data access

**Isolation Layers**
1. **Database Level**: RLS policies enforce isolation
2. **Application Level**: Backend validates organization context
3. **API Level**: Middleware ensures organization scoping

### Data Leakage Prevention

**RLS Enforcement**
- Every RLS policy checks organization_id
- Policies prevent cross-tenant queries
- Even with direct database access, RLS applies

**Application-Level Checks**
- Backend validates user's organization_id from JWT
- All queries filtered by organization_id
- User cannot access other organizations' data

**Service Role Protection**
- Service role key only used on backend
- Never exposed to frontend
- Backend enforces organization isolation

## 5. Audit Trails

### Audit Logging

**Logged Actions**
- CREATE operations (POST)
- UPDATE operations (PUT, PATCH)
- DELETE operations
- Status changes
- Grade changes
- Access attempts

**Audit Log Structure**
```sql
audit_log
├── id (UUID)
├── user_id (UUID) - User who performed action
├── action (VARCHAR) - Action type (CREATE, UPDATE, DELETE)
├── entity (VARCHAR) - Table/entity name
├── entity_id (UUID) - Target record ID
├── old_values (JSONB) - Previous values
├── new_values (JSONB) - New values
├── ip_address (INET) - Request IP address
├── user_agent (TEXT) - Browser/client information
└── created_at (TIMESTAMPTZ) - Timestamp
```

**Audit Log Features**
- **Immutable**: Append-only, cannot be modified
- **Comprehensive**: Captures all critical actions
- **Queryable**: Search and filter audit logs
- **Exportable**: Export audit logs for compliance

### Compliance & Auditing

**Regulatory Compliance**
- Complete audit trail for EASA compliance
- One-click audit report generation
- Exportable audit logs
- Immutable records

**Audit Report Generation**
- PDF reports with complete audit trail
- Filterable by user, date, action type
- Includes all metadata (IP, user agent, etc.)
- Suitable for regulatory audits

## 6. Network Security

### HTTPS/TLS

**Encryption**
- All communication encrypted via HTTPS
- TLS 1.2+ required
- Strong cipher suites only
- Certificate validation

**Certificate Management**
- Let's Encrypt for SSL certificates
- Automatic certificate renewal
- Certificate pinning (if applicable)

### CORS Configuration

**Cross-Origin Resource Sharing**
- Configured for specific origins only
- Credentials support enabled
- Preflight request handling
- Production: Restricted to frontend domain

**CORS Settings**
```javascript
cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
})
```

### Rate Limiting

**API Rate Limiting** (Recommended)
- Limit requests per IP address
- Prevent abuse and DoS attacks
- Configurable limits per endpoint
- Graceful error responses

**Implementation** (Future)
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

## 7. Secrets Management

### Environment Variables

**Secret Storage**
- All secrets stored in environment variables
- Never committed to version control
- `.env` files in `.gitignore`
- Production: Managed via hosting platform

**Required Secrets**
- `SUPABASE_SERVICE_KEY`: Backend database access
- `JWT_SECRET`: Token verification (from Supabase)
- `SUPABASE_ANON_KEY`: Frontend Supabase access
- Other API keys and secrets

### Secret Rotation

**Rotation Policy**
- Rotate secrets periodically (quarterly recommended)
- Update environment variables
- Restart application after rotation
- Document rotation procedures

### Secret Exposure Prevention

**Best Practices**
- Never log secrets
- Never expose secrets in error messages
- Use different secrets for each environment
- Review code for secret exposure

## 8. Security Headers

### Helmet Configuration

**Security Headers Set**
- Content-Security-Policy (CSP)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security (HSTS)

**Helmet Setup**
```javascript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
})
```

## 9. Vulnerability Management

### Dependency Security

**Regular Updates**
- Monitor for security vulnerabilities
- Update dependencies regularly
- Use `npm audit` to check for vulnerabilities
- Test updates before deployment

**Security Scanning**
- Automated vulnerability scanning (GitHub Dependabot, etc.)
- Regular security audits
- Penetration testing (if applicable)
- Code review for security issues

### Security Monitoring

**Monitoring Tools**
- Error tracking (Sentry, etc.)
- Security event logging
- Failed authentication attempt tracking
- Unusual access pattern detection

**Alert Configuration**
- Alert on security events
- Monitor for suspicious activity
- Track failed login attempts
- Monitor for data breaches

## 10. Compliance & Regulations

### Regulatory Compliance

**EASA Compliance**
- ADR.OR.D.017 compliant
- Complete audit trail
- Immutable records
- Digital signatures

**Other Regulations**
- Configurable for organization-specific requirements
- Custom compliance rules support
- Audit report generation
- Regulatory standard tracking

### Data Protection

**GDPR Compliance** (if applicable)
- Data minimization
- Right to access
- Right to deletion
- Data portability
- Privacy by design

**Data Retention**
- Configurable retention policies
- Automatic data archival
- Secure data deletion
- Compliance with retention requirements

## Security Best Practices

### Development

- Never commit secrets to version control
- Use parameterized queries
- Validate all inputs
- Follow principle of least privilege
- Regular security code reviews

### Deployment

- Use HTTPS in production
- Configure security headers
- Enable rate limiting
- Monitor for security events
- Regular security audits

### Operations

- Rotate secrets regularly
- Monitor for security events
- Keep dependencies updated
- Review audit logs regularly
- Incident response procedures
