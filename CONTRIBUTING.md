# Contributing Guide

This document outlines development rules and best practices for contributing to this project. See [Chinese(Traditional) version](CONTRIBUTING_CH.md) if needed.

---

## Development Flow

We organize development into phases, but **these phases are not sequential or restrictive**. Contributors are allowed to work across different platforms and phases in parallel as long as coordination is clear and consistent.

Typical development phases:

- `demo`: initial prototype for fast iteration and feedback
- `backend`: core API and business logic
- `frontend`: web UI implementation
- `ios-improved`: refined iOS app using backend APIs and user feedback
- `aos`: Android version aligned with iOS
- `test`: public testing
- `release`: production release

---

## Branch Naming Convention

Format:

```
[phase]/[platform]/[type]-[short-description]
```

- **phase**: `demo`, `backend`, `frontend`, `ios-improved`, `aos`, `test`, `release`, etc.
- **platform**: `ios`, `android`, `web`, `api`, `shared`, etc.
- **type**: `feature`, `fix`, `refactor`, `chore`

Examples:

- `demo/ios/feature-score-ui`
- `backend/api/fix-login-bug`
- `frontend/web/refactor-navbar`
- `release/shared/chore-cleanup`

Use lowercase and hyphens (`-`) for readability.

---

## Commit Message Guidelines

Format:

```
[type] short description

(optional) Additional context or explanation.
```

Commit types:

- `feat`: new features
- `fix`: bug fixes
- `refactor`: code restructuring
- `chore`: config, tools, or other minor tasks
- `docs`: documentation updates
- `style`: code style, formatting
- `test`: testing changes

Examples:

```
[feat] add score caching to reduce requests
```

```
[fix] resolve crash on login cold start
```

---

## Pull Request Guidelines

- PR branches must follow naming convention.
- PR titles should reflect the branch name.
- PR description must include:
  - Summary of changes
  - Background or reasoning
  - Screenshots if applicable

---

## Code Style

- Consistent indentation (2 or 4 spaces, depending on language)
- Descriptive variable/function names
- Avoid deep nesting, prefer small helper functions
- Remove debug logs before commit
- Follow existing file style when modifying

---

## Project Structure (Current)

```
/
├── ios/
├── android/
├── backend/
├── frontend/
├── shared/
├── public-test/
└── docs/
```

---

## Additional Notes

- Development phases are used for organization, not sequencing. Work in parallel is allowed.
- Keep PRs focused on a single scope.
- Do not push directly to `main` — use PR review.
