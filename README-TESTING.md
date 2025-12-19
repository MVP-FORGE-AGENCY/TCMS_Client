# TCMS E2E Testing Guide

## Prerequisites

1. **Backend running** on port 3000: `cd ../TCMS && npm run dev`
2. **Frontend running** on port 5173: `npm run dev`
3. **Playwright installed**: `npm install` (already done)

## Quick Start

```bash
# Seed test data (run once or when you need fresh data)
cd ../TCMS
npm run seed:test

# Run all E2E tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# View HTML report
npm run test:e2e:report
```

## Test Users

| Role         | Email                    | Password  |
| ------------ | ------------------------ | --------- |
| Admin        | admin@testaero.com       | Test1234! |
| Manager      | manager@testaero.com     | Test1234! |
| Instructor 1 | instructor1@testaero.com | Test1234! |
| Instructor 2 | instructor2@testaero.com | Test1234! |
| Assessor 1   | assessor1@testaero.com   | Test1234! |
| Assessor 2   | assessor2@testaero.com   | Test1234! |
| Employee 1   | employee1@testaero.com   | Test1234! |
| Employee 2   | employee2@testaero.com   | Test1234! |
| Employee 3   | employee3@testaero.com   | Test1234! |
| Auditor      | auditor@testaero.com     | Test1234! |
| External     | external@handler.co      | Test1234! |

## Test Coverage

| Test File                      | Coverage                                   |
| ------------------------------ | ------------------------------------------ |
| `setup.spec.ts`                | Health checks, database seeding            |
| `auth.spec.ts`                 | Login, logout, role visibility, RLS        |
| `training-sessions.spec.ts`    | Create, enrol, record results, sign        |
| `proficiency-checks.spec.ts`   | Multi-assessor, evaluations, signatures    |
| `competence-dashboard.spec.ts` | Matrix, KPIs, filters, export              |
| `absence-workflow.spec.ts`     | Refresher flags, absence records           |
| `retake-workflow.spec.ts`      | Failed attempts, remedial, waiting periods |
| `personnel-files.spec.ts`      | History, training file PDF, reports        |

## Troubleshooting

**Tests timing out?**

- Ensure both backend and frontend are running
- Check console for API errors
- Run in headed mode: `npm run test:e2e:headed`

**Seed script failing?**

- Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in backend `.env`
- Verify Supabase project is accessible

**Login test failing?**

- Run seed script to create test users: `cd ../TCMS && npm run seed:test`

## Adding New Tests

1. Create file in `tests/e2e/` with `.spec.ts` extension
2. Import helpers: `import { loginAs } from '../helpers/auth.helper'`
3. Use `test.describe()` and `test()` from Playwright
4. Run to verify: `npm run test:e2e -- --grep "your test name"`

## Configuration

Edit `playwright.config.ts` for:

- Timeout settings
- Browser selection
- Screenshot/video options
- Base URL (default: `http://localhost:5173`)
