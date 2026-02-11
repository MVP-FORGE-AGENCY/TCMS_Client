---
name: frontend-react-standards
description: Use this skill when changing the Vite/React frontend for CertifyCloud, including auth flows, API calls, forms, and role-based UI gating.
---

# Frontend Standards (Vite + React)

## Goal

Keep the frontend stable late in development: minimal diffs, consistent API usage, and no security regressions.

## API + auth rules

- Do not store secrets in the client; use public Supabase client patterns only.
- Treat the UI as untrusted: backend must enforce all authorization regardless of UI gating.
- Centralize API calls and error handling; do not sprinkle ad-hoc fetch logic across components.

## UX rules for regulated workflows

- Make validation errors explicit and actionable; never silently drop user input.
- Avoid destructive actions without confirmation and clear audit implications (e.g., “this will be logged” if required).

## Definition of done (DoD)

- No breaking changes to existing API contracts without coordination.
- Role-based UI gating matches backend permissions (but does not replace them).
- Error states, loading states, and empty states are handled consistently.
