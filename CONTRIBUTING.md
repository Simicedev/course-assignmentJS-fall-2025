# Contributing Guide

Thanks for helping improve this project!

## Workflow Summary

1. Pick or create an issue (use templates).
2. Move issue to "In Progress" on the Project board.
3. Branch from `main` using naming convention.
4. Commit with conventional commits.
5. Open a Pull Request referencing the issue (e.g. `Closes #12`).
6. Ensure build + type-check passes.
7. Request review.

## Branch Naming

```
feat/<short-description>
fix/<short-description>
chore/<short-description>
refactor/<short-description>
docs/<short-description>
```

Examples:

```
feat/login-flow
fix/socket-reconnect
```

## Commit Message Format (Conventional Commits)

```
<type>(optional scope): <description>
```

Types: feat, fix, chore, docs, refactor, test, build, ci

Examples:

```
feat(auth): add refresh token handling
fix(posts): handle empty list response
```

## Issue Labels (suggested)

- `bug` – Defect in existing functionality
- `enhancement` – New feature or improvement
- `task` – General work item (refactor, maintenance)
- `docs` – Documentation-only
- `discussion` – Needs clarification / design
- `good first issue` – Starter friendly
- `help wanted` – Assistance welcome

## Kanban Board (GitHub Projects)

Recommended columns:

1. Backlog – Unprioritized ideas/tasks
2. Ready – Groomed & sized, ready to start
3. In Progress – Active development
4. Review – PR open / needs review
5. Done – Merged & deployed (or accepted)

Automation suggestions:

- When issue added to board, start in Backlog
- When linked PR opened, auto-move to Review
- When PR merged/closed with keyword (Closes #), auto-move to Done

## Opening Issues

Use templates. Provide:

- Clear description
- Reproduction steps (for bugs)
- Acceptance criteria (for features/tasks)

## Pull Requests

Checklist before opening:

- [ ] Issue referenced
- [ ] Lint / type-check passes
- [ ] No debug console.log left (unless intentional)
- [ ] README / docs updated if needed

## Environment / Local Setup

```
npm install
npm run dev      # frontend
npm start        # server
```

## Testing (Add When Introduced)

Add a `tests/` folder and use a runner like Vitest when testing is introduced.

## Code Style

- Prefer small pure functions
- Keep modules focused
- Avoid duplicating logic; extract helpers

## Security / Secrets

Never commit `.env` or credentials. Rotate keys if accidentally exposed.

## Questions

Open a GitHub Discussion or use the "Questions / General Discussion" link in the issue chooser.

---

Happy building!
