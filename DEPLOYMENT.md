# Deployment Guide

## Prerequisites
- Node.js 18+
- NPM 9+

## Environment Variables
Create a `.env.production` file with the following variables:

```env
VITE_API_URL=https://api.your-domain.com/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Build Steps
1. Install dependencies:
   ```bash
   npm ci
   ```

2. Run type checking and build:
   ```bash
   npm run build
   ```

3. Preview the production build locally:
   ```bash
   npm run preview
   ```

## Deployment Options

### Vercel
1. Import project from GitHub.
2. Set environment variables in Vercel dashboard.
3. Deploy.

### Netlify
1. Connect to GitHub repository.
2. Set build command to `npm run build`.
3. Set publish directory to `dist`.
4. Add environment variables.

### Docker
Use the provided `Dockerfile` (if applicable) or Nginx configuration to serve the `dist` folder.

## Verification Checklist
- [ ] Login flow works.
- [ ] Dashboard loads without errors.
- [ ] Navigation between pages works (client-side routing).
- [ ] Dark mode toggle persists preference.
- [ ] API requests are hitting the production endpoint.
