---
name: api-integration
description: Use this skill when integrating backend API calls in the React frontend, handling responses, errors, loading states, and Supabase client usage for CertifyCloud.
---

# API Integration (Frontend)

## Goal

Call the backend APIs consistently, handle errors gracefully, and never assume the backend trusts the client.

## API call patterns

- Centralize API calls in a service layer or custom hooks; do not inline fetch/axios throughout components.
- Use the Supabase client for auth token management; attach the token to every protected API request.
- Handle all states explicitly: loading, success, error, empty.

## Backend contract assumptions

- Backend enforces all authorization; the frontend UI gating is for UX only.
- Backend may reject requests even if the UI allowed them; show clear error messages to users.
- API response shapes should match documented contracts; if they drift, flag it rather than silently adapting.

## Error handling rules

- Display user-friendly messages for common errors (validation, forbidden, network).
- Log unexpected errors to the console or monitoring but do not expose stack traces to users.
- Retry logic (if any) must be idempotent-safe and respect rate limits.

## Definition of done (DoD)

- API calls are abstracted into services or hooks, not scattered in components.
- All request/response states handled (loading spinner, error banner, empty state).
- No secrets or backend URLs hardcoded; use environment variables.
- Token refresh/expiry handled per Supabase auth patterns.
