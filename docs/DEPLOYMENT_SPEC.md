# Deployment Specification

## Overview

This document outlines the deployment procedures, environments, and best practices for deploying the TCMS application (both frontend and backend).

## Deployment Architecture

```
┌─────────────────┐
│   Frontend      │  (Vercel/Netlify/VPS)
│   (React/Vite)  │
└────────┬────────┘
         │ HTTPS
         │ API Calls
         ▼
┌─────────────────┐
│   Backend API   │  (Railway/Heroku/VPS)
│   (Node/Express)│
└────────┬────────┘
         │
         │ Supabase Client
         ▼
┌─────────────────┐
│   Supabase      │
│   (PostgreSQL + │
│    Storage +    │
│     Auth)       │
└─────────────────┘
```

## Environments

### Development
- **Purpose**: Local development and testing
- **Frontend**: `http://localhost:5173` (Vite dev server)
- **Backend**: `http://localhost:3000`
- **Database**: Development Supabase project
- **Auto-reload**: Enabled
- **Error Details**: Full stack traces

### Staging
- **Purpose**: Pre-production testing
- **Frontend**: `https://staging.tcms.example.com`
- **Backend**: `https://api-staging.tcms.example.com`
- **Database**: Staging Supabase project
- **Features**: Production-like environment with test data

### Production
- **Purpose**: Live application
- **Frontend**: `https://tcms.example.com`
- **Backend**: `https://api.tcms.example.com`
- **Database**: Production Supabase project
- **Features**: Full monitoring, backups, error tracking

## Backend Deployment

### Prerequisites

- Node.js 18+ installed (or use Node version manager)
- Git repository access
- Supabase project configured
- Environment variables prepared

### Deployment Options

#### Option 1: Railway (Recommended)

**Advantages:**
- Simple GitHub integration
- Automatic deployments on push
- Built-in HTTPS
- Environment variable management
- Health check monitoring

**Steps:**

1. **Create Railway Project**
   ```bash
   # Install Railway CLI (optional)
   npm i -g @railway/cli
   
   # Login
   railway login
   
   # Or use Railway web dashboard
   ```

2. **Connect Repository**
   - Go to Railway dashboard
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `TCMS_API` repository

3. **Configure Environment Variables**
   In Railway project settings → Variables:
   ```env
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=eyJxxx...
   SUPABASE_SERVICE_KEY=eyJxxx...
   NODE_ENV=production
   PORT=3000
   CORS_ORIGIN=https://tcms.example.com
   ```

4. **Configure Build Settings**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Health Check Path: `/api/v1/health`

5. **Deploy**
   - Railway auto-deploys on push to main branch
   - Monitor deployment logs
   - Verify health check endpoint

**Railway Configuration File** (`railway.json`):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/v1/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### Option 2: Heroku

**Steps:**

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Or download from heroku.com
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create tcms-api
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set SUPABASE_URL=https://xxx.supabase.co
   heroku config:set SUPABASE_SERVICE_KEY=xxx
   heroku config:set NODE_ENV=production
   heroku config:set CORS_ORIGIN=https://tcms.example.com
   ```

4. **Create Procfile**
   ```
   web: node app.js
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

6. **Monitor**
   ```bash
   heroku logs --tail
   heroku open
   ```

#### Option 3: AWS EC2 / DigitalOcean Droplet

**Server Setup:**

1. **Provision Server**
   - Ubuntu 20.04+ LTS
   - Minimum: 1GB RAM, 1 CPU
   - Recommended: 2GB RAM, 2 CPU

2. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx -y
   ```

3. **Clone Repository**
   ```bash
   cd /var/www
   sudo git clone https://github.com/your-org/TCMS_API.git
   cd TCMS_API
   sudo npm install --production
   ```

4. **Configure Environment**
   ```bash
   sudo nano .env
   # Add all environment variables
   ```

5. **Start with PM2**
   ```bash
   pm2 start app.js --name tcms-api
   pm2 save
   pm2 startup  # Enable auto-start on reboot
   ```

6. **Configure Nginx Reverse Proxy**
   ```nginx
   # /etc/nginx/sites-available/tcms-api
   server {
       listen 80;
       server_name api.tcms.example.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Enable Site and SSL**
   ```bash
   sudo ln -s /etc/nginx/sites-available/tcms-api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   
   # Install Certbot for SSL
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d api.tcms.example.com
   ```

#### Option 4: Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
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
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - CORS_ORIGIN=${CORS_ORIGIN}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
```

**Deploy:**
```bash
docker-compose up -d
docker-compose logs -f
```

## Frontend Deployment

### Prerequisites

- Node.js 18+ and npm
- Git repository access
- Backend API URL
- Supabase credentials

### Build Process

```bash
# Install dependencies
npm ci

# Build for production
npm run build

# Output: dist/ directory
```

### Deployment Options

#### Option 1: Vercel (Recommended)

**Advantages:**
- Zero-config deployment
- Automatic HTTPS
- Edge network (CDN)
- Preview deployments for PRs
- Environment variable management

**Steps:**

1. **Install Vercel CLI** (optional)
   ```bash
   npm i -g vercel
   ```

2. **Deploy via Dashboard**
   - Go to vercel.com
   - Import GitHub repository (`TCMS_Client`)
   - Configure:
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm ci`

3. **Set Environment Variables**
   ```env
   VITE_API_URL=https://api.tcms.example.com/api/v1
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxx...
   ```

4. **Deploy**
   - Vercel auto-deploys on push to main
   - Preview deployments for pull requests

**Vercel Configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### Option 2: Netlify

**Steps:**

1. **Connect Repository**
   - Go to netlify.com
   - Add new site from Git
   - Select `TCMS_Client` repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: (root)

3. **Set Environment Variables**
   - Site settings → Environment variables
   - Add all `VITE_*` variables

4. **Configure Redirects** (`netlify.toml`):
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

#### Option 3: Static Hosting (Nginx/Apache)

**Steps:**

1. **Build Locally**
   ```bash
   npm run build
   ```

2. **Upload dist/ to Server**
   ```bash
   scp -r dist/* user@server:/var/www/tcms/
   ```

3. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name tcms.example.com;
       root /var/www/tcms;
       index index.html;
       
       # SPA routing
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

4. **Enable SSL** (Let's Encrypt)
   ```bash
   sudo certbot --nginx -d tcms.example.com
   ```

## Database Deployment

### Supabase Setup

1. **Create Supabase Project**
   - Go to supabase.com
   - Create new project
   - Note project URL and API keys

2. **Run Migrations**
   - Go to SQL Editor
   - Execute migrations in order:
     - `supabase/migration_v2.sql` (initial schema)
     - `supabase/migrations/001_*.sql`
     - `supabase/migrations/002_*.sql`
     - ... (all migrations in order)

3. **Configure Storage Buckets**
   - Go to Storage → Create bucket
   - Buckets needed:
     - `documents` (public or private)
     - `certificates` (private)
     - `reports` (private)

4. **Set Up RLS Policies**
   - Verify RLS is enabled on all tables
   - Test policies with different user roles

### Migration Deployment Process

**Development:**
```bash
# Manual execution in Supabase SQL Editor
# Test each migration individually
```

**Production:**
```bash
# Option 1: Supabase Dashboard
# Copy migration SQL → SQL Editor → Execute

# Option 2: Supabase CLI
supabase db push

# Option 3: Custom migration script
node scripts/apply_migration.js
```

## Environment Variables

### Backend Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...

# Server
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://tcms.example.com

# Optional
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Frontend Environment Variables

```env
# API
VITE_API_URL=https://api.tcms.example.com/api/v1

# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

**Note:** Frontend variables must be prefixed with `VITE_` to be accessible in the browser.

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Code reviewed and merged
- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] Backup strategy in place
- [ ] Monitoring configured

### Backend Deployment

- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Health check endpoint responding
- [ ] CORS configured correctly
- [ ] SSL certificate installed
- [ ] Logging configured
- [ ] Error tracking enabled (Sentry, etc.)

### Frontend Deployment

- [ ] Environment variables set
- [ ] Build completes successfully
- [ ] API URL points to correct backend
- [ ] Supabase credentials configured
- [ ] SPA routing configured (redirects)
- [ ] Static assets cached properly
- [ ] Analytics/tracking configured (if applicable)

### Post-Deployment

- [ ] Smoke tests passed
- [ ] Login flow works
- [ ] Critical features tested
- [ ] Performance monitoring active
- [ ] Error alerts configured
- [ ] Documentation updated

## Rollback Procedures

### Backend Rollback

**Railway/Heroku:**
```bash
# Railway: Use dashboard to rollback to previous deployment
# Heroku: 
heroku releases:rollback vXX
```

**VPS/Docker:**
```bash
# Revert to previous Git commit
git checkout <previous-commit>
npm install
pm2 restart tcms-api
# Or
docker-compose down
docker-compose up -d
```

### Frontend Rollback

**Vercel/Netlify:**
- Use dashboard to rollback to previous deployment
- Or redeploy previous Git commit

**Static Hosting:**
```bash
# Restore previous build
git checkout <previous-commit>
npm run build
scp -r dist/* user@server:/var/www/tcms/
```

### Database Rollback

**Supabase:**
- Use point-in-time recovery (if available)
- Or restore from backup
- Or create reverse migration script

## Monitoring and Alerts

### Health Checks

- **Backend**: `GET /api/v1/health`
- **Frontend**: Static file serving check
- **Database**: Connection check via health endpoint

### Monitoring Tools

- **Uptime**: UptimeRobot, Pingdom
- **Errors**: Sentry, Rollbar
- **Performance**: New Relic, Datadog
- **Logs**: Logtail, Papertrail, CloudWatch

### Alert Configuration

Set up alerts for:
- Health check failures
- High error rates
- Slow response times
- Database connection failures
- Disk space issues

## CI/CD Pipeline (Optional)

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Security Considerations

### Secrets Management

- Never commit `.env` files
- Use environment variables for all secrets
- Rotate secrets periodically
- Use secret management services (AWS Secrets Manager, etc.)

### SSL/TLS

- Always use HTTPS in production
- Use Let's Encrypt for free SSL certificates
- Configure HSTS headers
- Use strong cipher suites

### Firewall Rules

- Restrict database access to backend IPs only
- Use Supabase IP allowlist if possible
- Configure WAF rules if using Cloudflare/AWS

## Troubleshooting

### Common Issues

**Backend won't start:**
- Check environment variables
- Verify database connection
- Check port availability
- Review application logs

**Frontend build fails:**
- Check Node.js version
- Clear `node_modules` and reinstall
- Verify environment variables are set
- Check for TypeScript errors

**Database connection errors:**
- Verify Supabase credentials
- Check network connectivity
- Verify RLS policies
- Check connection pool limits

**CORS errors:**
- Verify `CORS_ORIGIN` matches frontend URL
- Check preflight request handling
- Verify credentials are included in requests

## Support and Maintenance

### Deployment Documentation

- Keep deployment procedures documented
- Update environment variable lists
- Document any custom configurations

### Regular Maintenance

- Update dependencies regularly
- Review and rotate secrets
- Monitor performance metrics
- Review error logs
