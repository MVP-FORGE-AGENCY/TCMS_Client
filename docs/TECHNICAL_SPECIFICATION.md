# Technical Specification

## Architecture Overview

TCMS follows a modern, API-first architecture separating the frontend presentation layer from the backend business logic and database. This separation enables independent scaling, development, and deployment of each layer.

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  React SPA (Vite) - TypeScript, Shadcn UI, Tailwind     │
└───────────────────────┬───────────────────────────────────┘
                        │ HTTPS/REST API
                        │ JWT Authentication
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    API LAYER                             │
│  Express.js - Node.js, Middleware, Controllers           │
└───────────────────────┬───────────────────────────────────┘
                        │ Supabase Client
                        │ Service Role Key
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    DATA LAYER                            │
│  Supabase - PostgreSQL, Storage, Auth                   │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Framework | React | 19.2+ | UI framework |
| Language | TypeScript | 5.9+ | Type safety |
| Build Tool | Vite | 7.2+ | Build tool & dev server |
| UI Library | Shadcn UI | Latest | Component library (Radix Primitives) |
| Styling | Tailwind CSS | 3.4+ | Utility-first CSS |
| State Management | React Query | 5.90+ | Server state management |
| State Management | React Context | Built-in | Client state (auth, theme) |
| Routing | React Router | 7.10+ | Client-side routing |
| Forms | React Hook Form | 7.68+ | Form management |
| Validation | Zod | 4.2+ | Schema validation |
| HTTP Client | Axios | 1.13+ | HTTP requests |
| Supabase Client | @supabase/supabase-js | 2.87+ | Supabase integration |
| Icons | Lucide React | 0.561+ | Icon library |
| Charts | Recharts | 3.6+ | Data visualization |
| Notifications | Sonner | 2.0+ | Toast notifications |
| Date Handling | date-fns | 4.1+ | Date manipulation |
| Internationalization | i18next | 25.7+ | Multi-language support |

### Backend Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Runtime | Node.js | 18+ | JavaScript runtime |
| Framework | Express.js | 4.18+ | Web framework |
| Database Client | @supabase/supabase-js | 2.39+ | Database operations |
| PDF Generation | Puppeteer | 21.11+ | Headless Chrome for PDFs |
| Task Scheduling | node-cron | 3.0+ | Scheduled tasks |
| Validation | Joi | 17.11+ | Request validation |
| Security | Helmet | 7.1+ | Security headers |
| Logging | Morgan | 1.10+ | HTTP request logging |
| CORS | cors | 2.8+ | Cross-origin resource sharing |
| File Upload | Multer | 2.0+ | File upload handling |
| Template Engine | EJS | 3.1+ | PDF template rendering |
| Markdown | Marked | 17.0+ | Markdown parsing |
| API Docs | Swagger | 6.2+ | API documentation |

### Database Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Database | PostgreSQL | 15+ | Relational database |
| Hosting | Supabase | Latest | Managed PostgreSQL |
| Storage | Supabase Storage | Latest | File storage |
| Authentication | Supabase Auth | Latest | JWT authentication |
| Row Level Security | PostgreSQL RLS | Built-in | Data isolation |

## Database Schema

### Schema Design Principles

1. **Normalization**: Properly normalized to reduce redundancy
2. **Multi-Tenancy**: All tables include `organisation_id` for isolation
3. **Referential Integrity**: Foreign keys enforce relationships
4. **Audit Trail**: Complete audit logging for compliance
5. **Soft Deletes**: `is_active` flags instead of hard deletes

### Core Tables

**Organizations**
- `organisations`: Organization master data

**Users & Authentication**
- `users`: User profiles linked to Supabase Auth
- `auth.users`: Supabase Auth user accounts (managed)

**Training**
- `training_programmes`: Training programme definitions
- `training_sessions`: Scheduled training sessions
- `session_results`: Training session results and grades
- `training_materials`: Training materials with versioning

**Proficiency**
- `proficiency_profiles`: Proficiency check profile definitions
- `proficiency_checks`: Scheduled proficiency checks
- `check_assessor_evaluations`: Multi-assessor evaluations

**Competence**
- `user_competences`: User competence status tracking
- `competence_status`: Status enum (valid, expiring_soon, expired, not_acquired)

**Supporting**
- `absences`: Employee absence tracking
- `standards`: Regulatory standards with versioning
- `documents`: Document storage references
- `audit_log`: Comprehensive audit trail
- `organisation_settings`: Organization-specific settings

### Database Features

**Row Level Security (RLS)**
- Policies enforce organization isolation
- Database-level security
- Prevents cross-tenant data access

**Stored Procedures & Functions**
- `calculate_competence_status_val()`: Status calculation
- `update_competence_statuses()`: Bulk status updates
- `get_traffic_light_dashboard()`: Dashboard aggregation

**Indexes**
- Strategic indexes on foreign keys
- Indexes on frequently queried columns
- Composite indexes for common query patterns

**Triggers**
- Audit triggers for change tracking
- Automatic timestamp updates
- Data validation triggers

## API Structure

### RESTful API Design

**Base URL**: `/api/v1`

**Standard Endpoints**
```
GET    /api/v1/resources          # List resources (with pagination, filtering)
GET    /api/v1/resources/:id      # Get single resource
POST   /api/v1/resources          # Create resource
PUT    /api/v1/resources/:id      # Update resource (full replacement)
PATCH  /api/v1/resources/:id      # Partial update
DELETE /api/v1/resources/:id      # Delete resource
```

### API Endpoints

**Authentication**
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

**Users**
- `GET /api/v1/users` - List users
- `GET /api/v1/users/:id` - Get user
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

**Training Programmes**
- `GET /api/v1/programmes` - List programmes
- `GET /api/v1/programmes/:id` - Get programme
- `POST /api/v1/programmes` - Create programme
- `PUT /api/v1/programmes/:id` - Update programme

**Training Sessions**
- `GET /api/v1/sessions` - List sessions
- `GET /api/v1/sessions/:id` - Get session
- `POST /api/v1/sessions` - Create session
- `PUT /api/v1/sessions/:id` - Update session
- `POST /api/v1/sessions/:id/results` - Record results

**Proficiency Checks**
- `GET /api/v1/checks` - List checks
- `GET /api/v1/checks/:id` - Get check
- `POST /api/v1/checks` - Create check
- `PUT /api/v1/checks/:id` - Update check
- `POST /api/v1/checks/:id/finalize` - Finalize check

**Competence**
- `GET /api/v1/competence/dashboard` - Traffic light dashboard
- `GET /api/v1/competence/user/:id` - User competence status
- `GET /api/v1/competence/history/:id` - Competence history

**Reports**
- `GET /api/v1/reports/employee/:id` - Employee dossier PDF
- `GET /api/v1/reports/session/:id` - Session report PDF
- `GET /api/v1/reports/expiring` - Expiring competences report

### Request/Response Format

**Request Headers**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Success Response**
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

**Error Response**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }
  }
}
```

### API Versioning

- Current version: `v1`
- Version prefix: `/api/v1`
- Future versions: `/api/v2`, etc.
- Backward compatibility maintained where possible

## Key External Dependencies

### Frontend Dependencies

- **@supabase/supabase-js**: Supabase client for authentication and storage
- **axios**: HTTP client for API requests
- **date-fns**: Date manipulation and formatting
- **zod**: Schema validation
- **react-query**: Server state management
- **react-router-dom**: Client-side routing

### Backend Dependencies

- **@supabase/supabase-js**: Database client (service role)
- **puppeteer**: PDF generation from HTML templates
- **node-cron**: Scheduled task execution
- **joi**: Request validation
- **helmet**: Security headers
- **morgan**: HTTP request logging
- **ejs**: Template engine for PDFs

## Performance Considerations

### Frontend Performance

**Code Splitting**
- Route-based code splitting
- Lazy loading of components
- Dynamic imports for large dependencies

**Caching**
- React Query caches API responses
- Browser caching for static assets
- Service worker for offline support (future)

**Optimization**
- Vite optimizes production builds
- Tree shaking removes unused code
- Asset optimization (minification, compression)

### Backend Performance

**Database Optimization**
- Strategic indexes on frequently queried columns
- Query optimization with EXPLAIN ANALYZE
- Connection pooling (handled by Supabase)
- Stored procedures for complex aggregations

**API Optimization**
- Response compression (gzip)
- Pagination for large datasets
- Filtering and sorting at database level
- Caching for static data (future: Redis)

**PDF Generation**
- Puppeteer connection pooling
- Template caching
- Async PDF generation
- Background job processing (future)

### Database Performance

**Query Optimization**
- Use indexes effectively
- Avoid N+1 queries
- Use JOINs instead of multiple queries
- Batch operations where possible

**Connection Management**
- Supabase handles connection pooling
- Monitor connection pool usage
- Configure pool size if needed

## Scalability

### Horizontal Scaling

**Stateless Design**
- No server-side sessions
- JWT tokens (stateless)
- Load balancer distributes requests
- Multiple API instances

**Database Scaling**
- Supabase handles database scaling
- Read replicas for heavy read workloads
- Connection pooling for concurrent connections

### Vertical Scaling

**Resource Scaling**
- Increase server resources (CPU, RAM)
- Monitor resource usage
- Scale based on metrics

**Application Scaling**
- PM2 cluster mode for Node.js
- Docker containers with resource limits
- Auto-scaling based on load

## Development Tools

### Frontend Development

- **Vite**: Fast dev server with HMR
- **TypeScript**: Type checking
- **ESLint**: Code linting
- **Playwright**: E2E testing

### Backend Development

- **Node.js**: Runtime
- **Express**: Web framework
- **Swagger**: API documentation
- **Morgan**: Request logging

### Database Development

- **Supabase Dashboard**: Database management
- **SQL Editor**: Query execution
- **Migration Files**: Version-controlled schema changes

## Deployment Architecture

### Production Setup

```
Frontend (Vercel/Netlify)
    ↓ HTTPS
Backend API (Railway/Heroku/VPS)
    ↓ Supabase Client
Supabase (PostgreSQL + Storage + Auth)
```

### Environment Configuration

**Frontend**
- `VITE_API_URL`: Backend API URL
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

**Backend**
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_KEY`: Supabase service role key
- `CORS_ORIGIN`: Allowed frontend origin
- `NODE_ENV`: Environment (production/development)

## Monitoring & Observability

### Logging

**Frontend**
- Console logging (development)
- Error tracking (Sentry, etc.)

**Backend**
- Morgan HTTP logging
- Application logs
- Error logs
- Audit logs (database)

### Metrics

- API response times
- Error rates
- Database query performance
- User activity

### Health Checks

- `GET /api/v1/health` - Basic health check
- `GET /api/v1/ready` - Readiness check (includes DB)

## Future Enhancements

### Planned Technical Improvements

- **Real-time Updates**: Supabase Realtime for live data
- **Caching Layer**: Redis for static data caching
- **GraphQL API**: Optional GraphQL endpoint
- **Microservices**: Split into microservices if needed
- **Kubernetes**: Container orchestration for scale
- **Service Mesh**: Advanced service communication

### Performance Optimizations

- **CDN**: Content delivery network for static assets
- **Database Read Replicas**: For heavy read workloads
- **Query Optimization**: Continuous query optimization
- **Caching Strategies**: Advanced caching patterns
