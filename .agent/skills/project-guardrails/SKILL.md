---
name: project-guardrails
description: Use this skill for any change in the CertifyCloud frontend to enforce minimal diffs, compatibility with backend APIs, and React best practices.
---

# Project Guardrails (Frontend)

## Context

This is the **frontend repository** (Vite/React). The backend is a separate repo; we consume its REST APIs.

## Default behavior

- Prefer the smallest change that meets the requirement.
- Do not refactor component structure, rename folders, or reformat large areas unless explicitly requested.
- Do not introduce new npm packages without approval.
- Do not assume the backend will change to accommodate frontend convenience.

## Breaking changes require approval

- Changing the API client/service layer in a way that affects all components.
- Modifying shared context providers (Auth, Theme, etc.).
- Changing routing structure or protected route logic.
- Updating Supabase client configuration.

## Safety checks before proposing changes

- What could break: auth flows, protected routes, API contracts, form validation.
- If uncertain about repo conventions (component folder structure, naming, styling approach), ask before inventing a new pattern.

## Repo structure (fill this in based on your actual structure)

- Components: `src/components/` (organized by feature or common/shared)
- Pages: `src/pages/` or `src/routes/`
- Hooks: `src/hooks/`
- Services: `src/services/` (API calls)
- Utils: `src/utils/`
- Contexts: `src/contexts/` or `src/providers/`
- Types: `src/types/` (if using TypeScript)

## Acceptance criteria

- Changes preserve existing component APIs unless explicitly approved.
- API contracts match backend documentation; flag mismatches rather than adapting silently.
- Auth and role-based UI gating consistent with backend permission model.
- Tests updated (component tests, integration tests, or E2E if applicable).
