---
name: frontend-security
description: Use this skill when implementing client-side authentication flows, role-based UI gating, secure routing, token handling, or input sanitization in the React frontend for CertifyCloud.
---

# Frontend Security

## Goal

Prevent common client-side vulnerabilities and enforce consistent auth/authz UX without replacing backend enforcement.

## Authentication rules

- Use Supabase Auth client for login/logout/session management.
- Store tokens only in Supabase-managed storage (not localStorage directly unless Supabase does so).
- Redirect unauthenticated users to login; redirect authenticated users away from login page.

## Role-based UI gating

- Hide/show UI elements based on user role for UX, but understand the backend must re-check permissions.
- Fetch user role/permissions from a verified backend endpoint or Supabase metadata; do not trust client-side-only state.
- If a user tries to access a route they shouldn't, show a "Forbidden" page rather than silently redirecting.

## Input handling

- Sanitize user inputs before display if they come from untrusted sources (other users, old data).
- Validate form inputs on the client for UX, but expect the backend to reject invalid data anyway.

## Secure routing

- Protect routes with auth checks; use route guards or wrapper components.
- Do not expose admin-only routes in the router config if the user is not an admin (hides routes from dev tools inspection).

## Definition of done (DoD)

- Auth flows tested: login, logout, token expiry, session refresh.
- Protected routes redirect correctly for unauthenticated and unauthorized users.
- No sensitive data (tokens, API keys) logged or exposed in client code.
- Role-based UI elements match backend permission model.
