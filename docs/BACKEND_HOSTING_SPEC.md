# Backend and Hosting Specification

## Overview

The TCMS backend is a Node.js/Express.js REST API that serves as the core business logic layer for the Training & Competence Management System. It handles authentication, authorization, data processing, and integration with Supabase (PostgreSQL database and storage).

## Architecture

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Database**: Supabase (PostgreSQL 15+)
- **Authentication**: Supabase Auth (JWT-based)
- **Storage**: Supabase Storage (for PDFs, documents, certificates)
- **PDF Generation**: Puppeteer (headless Chrome)
- **Task Scheduling**: node-cron
- **API Documentation**: Swagger/OpenAPI 3.0

### Application Structure

```
TCMS_API/
├── app.js                    # Express application entry point
├── package.json              # Dependencies and scripts
├── .env                      # Environment configuration
├── controllers/              # Business logic handlers
│   ├── auth.js
│   ├── users.js
│   ├── programmes.js
│   ├── sessions.js
│   ├── checks.js
│   ├── competence.js
│   └── ...
├── middleware/               # Request processing middleware
│   ├── auth.js              # JWT authentication
│   ├── rbac.js              # Role-based access control
│   ├── audit.js             # Audit logging
│   └── validation.js        # Input validation
├── routes/                   # API route definitions
│   ├── auth.js
│   ├── users.js
│   └── ...
├── services/                 # Business services
│   ├── pdfGenerator.js
│   └── CompetenceService.js
├── validators/               # Request validation schemas
│   └── schemas.js
├── supabase/                 # Database configuration
│   ├── client.js
│   ├── migration_v2.sql
│   └── migrations/          # Incremental migrations
├── cron/                     # Scheduled tasks
│   └── index.js
└── templates/                # PDF/Email templates
    └── *.html
```

## API Architecture

### RESTful Design

The API follows REST conventions:

- `GET /api/v1/resources` - List resources (with pagination, filtering)
- `GET /api/v1/resources/:id` - Get single resource
- `POST /api/v1/resources` - Create resource
- `PUT /api/v1/resources/:id` - Update resource (full replacement)
- `PATCH /api/v1/resources/:id` - Partial update
- `DELETE /api/v1/resources/:id` - Delete resource

### API Versioning

- Current version: `v1`
- Version prefix: `/api/v1`
- Future versions will use `/api/v2`, etc.

### Request/Response Format

**Request Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Success Response:**
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

**Error Response:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

## Middleware Stack

### 1. Security Middleware (Helmet)
- Content Security Policy
- XSS Protection
- MIME Type Sniffing Prevention
- Frame Options

### 2. CORS Configuration
- Configurable allowed origins
- Credentials support
- Preflight handling

### 3. Request Parsing
- JSON body parser (10MB limit)
- URL-encoded parser
- File upload support (Multer)

### 4. Authentication Middleware
- JWT token extraction from `Authorization` header
- Token validation via Supabase Auth
- User context population (`req.user`, `req.userDetails`)

### 5. Authorization Middleware
- Role-based access control (RBAC)
- Minimum role level checks
- Organization-scoped access

### 6. Audit Logging
- Automatic logging of state-changing operations
- Captures: action, user, resource, timestamp, IP
- Excludes health checks and read-only operations

### 7. Error Handling
- Centralized error handler
- Structured error responses
- Development vs. production error details

## Environment Configuration

### Required Environment Variables

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Server Configuration
PORT=3000
NODE_ENV=production|development|test
CORS_ORIGIN=https://your-frontend-domain.com

# Security
JWT_SECRET=your-jwt-secret-from-supabase

# Optional: External Services
EMAIL_SERVICE_API_KEY=optional-email-service-key
```

### Environment-Specific Behavior

- **Development**: Detailed error messages, request body logging, auto-reload
- **Production**: Sanitized errors, optimized logging, security headers
- **Test**: Mocked external services, test database

## Hosting Options

### Option 1: Railway (Recommended)

**Advantages:**
- Simple deployment from GitHub
- Automatic HTTPS
- Built-in environment variable management
- Auto-scaling support
- Health check monitoring

**Deployment Steps:**
1. Connect GitHub repository
2. Set environment variables in Railway dashboard
3. Configure build command: `npm install`
4. Configure start command: `npm start`
5. Set health check path: `/api/v1/health`

**Railway Configuration:**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/v1/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Option 2: Heroku

**Setup:**
1. Create `Procfile`: `web: node app.js`
2. Set environment variables via Heroku CLI or dashboard
3. Deploy via Git push: `git push heroku main`

**Scaling:**
```bash
heroku ps:scale web=2
```

### Option 3: AWS EC2 / DigitalOcean Droplet

**Requirements:**
- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+ installed
- PM2 or systemd for process management
- Nginx as reverse proxy
- SSL certificate (Let's Encrypt)

**PM2 Configuration:**
```json
{
  "name": "tcms-api",
  "script": "app.js",
  "instances": 2,
  "exec_mode": "cluster",
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 4: Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
    restart: unless-stopped
```

## Performance Considerations

### Database Connection Pooling

Supabase handles connection pooling automatically. For high-traffic scenarios:
- Monitor connection pool usage
- Consider connection pooler configuration in Supabase dashboard

### Caching Strategy

- **Static Data**: Cache training programmes, proficiency profiles (Redis optional)
- **User Sessions**: JWT tokens (stateless, no server-side cache needed)
- **PDF Generation**: Consider caching generated PDFs in Supabase Storage

### Rate Limiting

Implement rate limiting for production:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/v1/', limiter);
```

### Monitoring

**Recommended Tools:**
- **Application Monitoring**: Sentry, New Relic, or Datadog
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Log Aggregation**: Logtail, Papertrail, or CloudWatch Logs

**Health Check Endpoint:**
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/ready` - Readiness check (includes DB connectivity)

## Scheduled Tasks (Cron Jobs)

### Expiry Notifications
- **Schedule**: Daily at 6:00 AM (Europe/London)
- **Purpose**: Check for expiring competences and log notifications
- **Alert Thresholds**: 90, 30, 14, 7, 0 days before expiry

### Competence Status Refresh
- **Schedule**: Daily at 5:00 AM
- **Purpose**: Refresh competence status calculations for all users
- **Performance**: Processes all organizations sequentially

### Data Quality Validation
- **Schedule**: Daily at 4:00 AM
- **Purpose**: Validate data integrity and flag issues
- **Checks**: Missing training records, invalid training sequences

## Security Considerations

### API Security

1. **Authentication**: All endpoints (except health checks) require JWT authentication
2. **Authorization**: RBAC middleware enforces role-based permissions
3. **Input Validation**: All inputs validated via Joi schemas
4. **SQL Injection Prevention**: Parameterized queries via Supabase client
5. **XSS Prevention**: Helmet CSP headers, input sanitization

### Secrets Management

- **Never commit** `.env` files to version control
- Use environment variables for all secrets
- Rotate JWT secrets periodically
- Use Supabase service role key only on backend (never expose to frontend)

### Network Security

- HTTPS only in production
- CORS configured for specific origins
- Rate limiting to prevent abuse
- Request size limits (10MB)

## Scaling Considerations

### Horizontal Scaling

- Stateless API design (JWT tokens, no server-side sessions)
- Load balancer distributes requests across multiple instances
- Database connection pooling handles concurrent connections

### Vertical Scaling

- Increase server resources (CPU, RAM) for single-instance deployments
- Monitor memory usage (especially for PDF generation with Puppeteer)

### Database Scaling

- Supabase handles database scaling automatically
- Consider read replicas for heavy read workloads
- Optimize queries with proper indexes (see Database spec)

## Backup and Disaster Recovery

### Database Backups

- Supabase provides automatic daily backups
- Point-in-time recovery available
- Manual backup via Supabase dashboard or CLI

### Application State

- Stateless application (no local state)
- Configuration stored in environment variables
- Code stored in version control (Git)

### Recovery Procedures

1. **Database Corruption**: Restore from Supabase backup
2. **Application Failure**: Redeploy from Git repository
3. **Data Loss**: Restore from most recent backup

## API Documentation

### Swagger UI

- **Endpoint**: `/api-docs`
- **OpenAPI Spec**: `/api-docs.json`
- **Authentication**: Bearer token required for protected endpoints

### Documentation Standards

- All routes documented with Swagger/OpenAPI annotations
- Request/response schemas defined
- Example requests provided
- Error responses documented

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Run in development mode (with auto-reload)
npm run dev

# Run tests
npm test
```

### Code Quality

- ESLint for code linting
- Consistent code style (no enforced formatter, but recommended: Prettier)
- Type checking via JSDoc comments

### Testing

- Unit tests: `tests/*.test.js`
- E2E tests: `tests/e2e.test.js`
- Test data seeding: `scripts/seed-test-data.js`

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Health check endpoint responding
- [ ] CORS origins configured correctly
- [ ] SSL certificate installed (production)
- [ ] Monitoring and logging set up
- [ ] Backup strategy in place
- [ ] Rate limiting configured
- [ ] Error tracking configured (Sentry, etc.)
- [ ] API documentation accessible
- [ ] Load testing completed
