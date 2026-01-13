# Full Stack Specification

## Overview

TCMS is a full-stack application consisting of a React frontend, Node.js/Express backend API, and Supabase (PostgreSQL) database. This document describes the complete architecture, data flow, and integration points.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React Application (Vite)                             │   │
│  │  - React Router (Routing)                            │   │
│  │  - React Query (Server State)                        │   │
│  │  - React Context (Auth State)                        │   │
│  │  - React Hook Form (Forms)                           │   │
│  │  - Shadcn UI (Components)                            │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS/REST API
                        │ JWT Authentication
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Express.js Server                                   │   │
│  │  - Authentication Middleware                         │   │
│  │  - RBAC Middleware                                   │   │
│  │  - Validation Middleware                             │   │
│  │  - Audit Logging                                     │   │
│  │  - Controllers (Business Logic)                    │   │
│  │  - Services (PDF Generation, etc.)                  │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │ Supabase Client
                        │ Service Role Key
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │   Storage    │  │     Auth     │      │
│  │  Database    │  │   (Files)   │  │  (JWT/Users) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│       Supabase Platform                                      │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2+ | UI Framework |
| TypeScript | 5.9+ | Type Safety |
| Vite | 7.2+ | Build Tool & Dev Server |
| React Router | 7.10+ | Client-side Routing |
| React Query | 5.90+ | Server State Management |
| React Hook Form | 7.68+ | Form Management |
| Zod | 4.2+ | Schema Validation |
| Shadcn UI | Latest | Component Library |
| Tailwind CSS | 3.4+ | Styling |
| Axios | 1.13+ | HTTP Client |
| Supabase JS | 2.87+ | Supabase Client |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express.js | 4.18+ | Web Framework |
| Supabase JS | 2.39+ | Database Client |
| Puppeteer | 21.11+ | PDF Generation |
| node-cron | 3.0+ | Scheduled Tasks |
| Joi | 17.11+ | Validation |
| Helmet | 7.1+ | Security Headers |
| Morgan | 1.10+ | HTTP Logging |

### Database Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 15+ | Relational Database |
| Row Level Security | Built-in | Data Isolation |
| Supabase Storage | Latest | File Storage |
| Supabase Auth | Latest | Authentication |

## Data Flow

### Authentication Flow

```
1. User enters credentials
   ↓
2. Frontend calls Supabase Auth
   ↓
3. Supabase returns JWT token
   ↓
4. Frontend stores token (localStorage/sessionStorage)
   ↓
5. Frontend includes token in API requests (Authorization header)
   ↓
6. Backend validates token via Supabase Auth
   ↓
7. Backend loads user details from database
   ↓
8. Request proceeds with user context
```

### API Request Flow

```
1. User action triggers API call
   ↓
2. React Query manages request state
   ↓
3. Axios sends HTTP request with JWT token
   ↓
4. Express middleware stack:
   a. Helmet (Security headers)
   b. CORS (Cross-origin)
   c. Body Parser (JSON parsing)
   d. Morgan (Logging)
   e. Authentication (JWT validation)
   f. RBAC (Role check)
   g. Validation (Input validation)
   ↓
5. Controller processes request
   ↓
6. Service layer (if needed) - PDF generation, etc.
   ↓
7. Database query via Supabase client
   ↓
8. Response sent back to frontend
   ↓
9. React Query updates cache
   ↓
10. UI updates automatically
```

### Database Query Flow

```
1. Controller calls Supabase client
   ↓
2. Supabase client uses service role key (bypasses RLS)
   ↓
3. Application logic enforces organization isolation
   ↓
4. Query executed on PostgreSQL
   ↓
5. Results returned to controller
   ↓
6. Data transformed/validated
   ↓
7. Response sent to frontend
```

## Frontend Architecture

### Project Structure

```
TCMS_Client/
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Root component
│   ├── components/           # Reusable components
│   │   ├── ui/              # Shadcn UI components
│   │   ├── forms/           # Form components
│   │   ├── tables/          # Table components
│   │   ├── modals/          # Modal components
│   │   └── layout/          # Layout components
│   ├── pages/               # Page components
│   │   ├── auth/            # Authentication pages
│   │   ├── dashboard/       # Dashboard pages
│   │   ├── personnel/       # Personnel management
│   │   ├── programmes/      # Training programmes
│   │   ├── sessions/        # Training sessions
│   │   ├── checks/          # Proficiency checks
│   │   └── ...
│   ├── context/             # React Context providers
│   │   └── AuthContext.tsx  # Authentication context
│   ├── lib/                 # Utilities
│   │   ├── api.ts          # API client (Axios)
│   │   ├── supabase.ts     # Supabase client
│   │   ├── utils.ts        # Helper functions
│   │   └── i18n.ts         # Internationalization
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   └── locales/             # Translation files
│       ├── en.json
│       └── bg.json
├── public/                   # Static assets
└── dist/                     # Build output
```

### State Management

**Server State (React Query):**
- API responses cached automatically
- Automatic refetching on window focus
- Optimistic updates for mutations
- Error handling and retry logic

**Client State (React Context):**
- Authentication state (user, token)
- Theme preferences (dark/light mode)
- Language preferences

**Local State (useState):**
- Form inputs
- UI state (modals, dropdowns)
- Component-specific state

### Routing

```typescript
// Route structure
/                    → Dashboard (protected)
/login               → Login page
/personnel           → Personnel list (protected)
/personnel/:id       → Personnel detail (protected)
/programmes          → Programmes list (protected)
/sessions            → Sessions list (protected)
/checks              → Checks list (protected)
/competence          → Competence dashboard (protected)
/reports             → Reports (protected)
/settings            → Settings (protected)
```

### API Integration

**API Client Setup:**
```typescript
// lib/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**React Query Hooks:**
```typescript
// Example: Fetch programmes
const { data, isLoading, error } = useQuery({
  queryKey: ['programmes'],
  queryFn: () => api.get('/programmes').then(res => res.data),
});

// Example: Create session
const mutation = useMutation({
  mutationFn: (data) => api.post('/sessions', data),
  onSuccess: () => {
    queryClient.invalidateQueries(['sessions']);
  },
});
```

## Backend Architecture

### Project Structure

```
TCMS_API/
├── app.js                    # Express app entry point
├── controllers/              # Request handlers
│   ├── auth.js
│   ├── users.js
│   ├── programmes.js
│   ├── sessions.js
│   ├── checks.js
│   └── ...
├── middleware/              # Express middleware
│   ├── auth.js             # JWT authentication
│   ├── rbac.js             # Role-based access control
│   ├── audit.js             # Audit logging
│   └── validation.js       # Input validation
├── routes/                  # Route definitions
│   ├── auth.js
│   ├── users.js
│   └── ...
├── services/                # Business logic services
│   ├── pdfGenerator.js
│   └── CompetenceService.js
├── validators/              # Validation schemas
│   └── schemas.js
├── supabase/                # Database configuration
│   ├── client.js
│   └── migrations/
├── cron/                     # Scheduled tasks
│   └── index.js
└── templates/               # PDF/Email templates
```

### Request Processing Pipeline

```
HTTP Request
    ↓
Helmet (Security headers)
    ↓
CORS (Cross-origin handling)
    ↓
Body Parser (JSON/URL-encoded)
    ↓
Morgan (Request logging)
    ↓
Audit Logging (State-changing ops)
    ↓
Authentication Middleware (JWT validation)
    ↓
Load User Middleware (Fetch user details)
    ↓
RBAC Middleware (Role check)
    ↓
Validation Middleware (Input validation)
    ↓
Route Handler (Controller)
    ↓
Service Layer (Business logic)
    ↓
Database Query (Supabase)
    ↓
Response
```

### Error Handling

**Error Response Format:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }
  }
}
```

**Error Types:**
- `400` - Validation errors
- `401` - Authentication errors
- `403` - Authorization errors
- `404` - Not found
- `500` - Server errors

## Database Architecture

### Schema Design Principles

1. **Multi-Tenancy**: All tables include `organisation_id`
2. **Normalization**: Properly normalized to reduce redundancy
3. **Referential Integrity**: Foreign keys enforce relationships
4. **Audit Trail**: Audit log table tracks all changes
5. **Soft Deletes**: `is_active` flags instead of hard deletes

### Key Relationships

```
organisations
    ↓ (1:N)
users
    ↓ (1:N)
training_sessions
    ↓ (1:N)
session_results

training_programmes
    ↓ (1:N)
training_sessions

proficiency_profiles
    ↓ (1:N)
proficiency_checks
    ↓ (1:N)
check_assessor_evaluations

users
    ↓ (1:N)
user_competences
```

### Data Isolation

**Row Level Security (RLS):**
- Enforced at database level
- Policies check `organisation_id`
- Prevents cross-tenant data access

**Application-Level Isolation:**
- Backend validates organization context
- User's organization_id from JWT
- All queries filtered by organization

## Integration Points

### Frontend ↔ Backend

**Communication:**
- RESTful API over HTTPS
- JSON request/response format
- JWT token in Authorization header
- Standard HTTP status codes

**Error Handling:**
- Frontend catches API errors
- Displays user-friendly messages
- Logs errors for debugging

### Backend ↔ Database

**Connection:**
- Supabase client library
- Service role key (bypasses RLS)
- Connection pooling handled by Supabase

**Query Patterns:**
- Parameterized queries (SQL injection prevention)
- Transaction support for multi-step operations
- Batch operations for bulk updates

### Frontend ↔ Supabase Auth

**Direct Integration:**
- Frontend uses Supabase Auth directly
- Login/logout handled by Supabase
- Token management by Supabase
- Backend validates tokens

## Security Architecture

### Authentication

- **Frontend**: Supabase Auth handles login
- **Backend**: Validates JWT tokens
- **Token Storage**: localStorage/sessionStorage (frontend)
- **Token Expiry**: Handled by Supabase

### Authorization

- **Role-Based**: RBAC middleware checks user roles
- **Organization Scoped**: All data filtered by organization
- **Database Level**: RLS policies enforce isolation

### Data Protection

- **HTTPS**: All communication encrypted
- **Input Validation**: All inputs validated
- **SQL Injection**: Parameterized queries
- **XSS Prevention**: React escapes by default
- **CSRF Protection**: SameSite cookies (if used)

## Performance Optimization

### Frontend

- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Components loaded on demand
- **Caching**: React Query caches API responses
- **Asset Optimization**: Vite optimizes assets
- **CDN**: Static assets served from CDN (Vercel/Netlify)

### Backend

- **Connection Pooling**: Supabase handles pooling
- **Query Optimization**: Indexes on frequently queried columns
- **Caching**: Consider Redis for static data (future)
- **Compression**: Gzip compression for responses

### Database

- **Indexes**: Strategic indexes on foreign keys and filters
- **Query Optimization**: Use EXPLAIN ANALYZE
- **Connection Pooling**: Handled by Supabase
- **Read Replicas**: Available for scaling (Supabase Pro)

## Development Workflow

### Local Development

**Frontend:**
```bash
cd TCMS_Client
npm install
npm run dev  # Starts Vite dev server on :5173
```

**Backend:**
```bash
cd TCMS_API
npm install
npm run dev  # Starts Express server on :3000
```

**Database:**
- Use Supabase local development (optional)
- Or connect to development Supabase project

### Testing

**Frontend:**
- Playwright E2E tests
- Component tests (future)
- API integration tests

**Backend:**
- Unit tests for controllers
- Integration tests for API endpoints
- Database migration tests

### Build Process

**Frontend:**
```bash
npm run build  # Outputs to dist/
```

**Backend:**
```bash
npm start  # Production mode
```

## Deployment Architecture

### Production Setup

```
Frontend (Vercel/Netlify)
    ↓ HTTPS
Backend API (Railway/Heroku/VPS)
    ↓ Supabase Client
Supabase (PostgreSQL + Storage + Auth)
```

### Environment Variables

**Frontend:**
- `VITE_API_URL` - Backend API URL
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

**Backend:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `CORS_ORIGIN` - Allowed frontend origin
- `NODE_ENV` - Environment (production/development)

## Monitoring and Observability

### Logging

**Frontend:**
- Console logging (development)
- Error tracking (Sentry, etc.)

**Backend:**
- Morgan HTTP logging
- Application logs
- Error logs
- Audit logs (database)

### Metrics

- API response times
- Error rates
- Database query performance
- User activity

### Alerts

- Health check failures
- High error rates
- Slow response times
- Database connection issues

## Future Enhancements

### Planned Features

- Real-time updates (Supabase Realtime)
- WebSocket support for live data
- Advanced caching (Redis)
- GraphQL API (optional)
- Microservices architecture (if needed)
- Kubernetes deployment (for scale)

### Scalability Considerations

- Horizontal scaling (stateless API)
- Database read replicas
- CDN for static assets
- Load balancing
- Auto-scaling based on traffic
