# SPAF Deployment and Commit Workflow Guide

**Last Updated:** April 15, 2026
**Applies To:** `spafnat.com` auto-deploying from `main`

---

## Goal

Use a safe branch workflow so production only updates when reviewed, tested, and intentionally merged into `main`.

---

## Recommended Workflow (Solo Developer)

1. `main` is always deployable.
2. All work happens on short-lived branches.
3. Open a PR for every branch, even when working solo.
4. Merge to `main` only after checks pass.
5. Production updates only from `main`.

This is the cleanest setup for your current deployment model.

---

## One-Time GitHub Setup

In GitHub branch protection for `main`:

- Require pull requests before merging.
- Disable direct pushes to `main`.
- Require status checks to pass (at least `test` and `build`).
- Require branch to be up to date before merging (optional but recommended).

Optional:
- Require linear history (works well if you prefer rebase merges).

---

## Day-to-Day Development Loop

```bash
# 1) Start from latest main
git switch main
git pull --ff-only

# 2) Create focused branch
git switch -c feat/<single-purpose>

# 3) Develop and commit in atomic slices
git add -p
npm run preflight
npm run typecheck
npm run test:run
npm run build
git commit -m "imperative single-purpose message"

# 4) Push and open PR
git push -u origin feat/<single-purpose>
```

If a branch grows too large, split it into multiple branches stacked from `main`.

---

## Atomic Commit Best Practices

An atomic commit should:

- Do one thing (or one tightly related change).
- Leave the branch in a stable, testable state.
- Be understandable without reading future commits.
- Have a one-line message in imperative form.

Good commit messages:

- `harden login rate limiting window`
- `reject oversized uploads in admin API`
- `add breadcrumb component to static pages`
- `refactor concours hook error handling`

Avoid:

- `misc fixes`
- `wip`
- `changes`
- commits mixing backend security + unrelated UI polish

---

## How To Split a Mixed Local Working Tree

When many unrelated local edits already exist:

```bash
# safety snapshot before splitting
git switch -c chore/split-local-changes
git diff > /tmp/spafnat-pre-split-$(date +%F).patch
```

Then repeat this cycle:

1. Stage only one responsibility (`git add -p`).
2. Run validation for that slice (at minimum `npm run test:run` and `npm run build`).
3. Commit with a single-purpose message.
4. Continue with the next responsibility.

Useful commands:

```bash
git status --short
git diff
git diff --staged
git restore --staged <file>         # unstage file
git reset -p                         # unstage selected hunks
git add -p                           # stage selected hunks
```

If a commit accidentally includes too much:

```bash
git reset --soft HEAD~1
# re-stage correctly with git add -p
```

---

## Definition of Stable State (Before Each Commit)

At minimum, each commit should satisfy:

```bash
npm run preflight
npm run typecheck
npm run test:run
npm run build
```

For tiny docs-only commits, full test/build can be skipped.

---

## Merge Strategy

Choose one and stay consistent:

- **Rebase and merge:** keeps atomic commits visible on `main` (best for clean commit history).
- **Squash and merge:** better when branch history is noisy.

For your "atomic commit" goal, prefer **Rebase and merge**.

---

## Pre-Merge Checklist

- Branch rebased on latest `main`.
- CI checks green.
- No debug logs, temporary flags, or TODO placeholders.
- Commit messages are single-purpose and readable.
- PR description states risk and rollback approach.

---

## Rollback Playbook

If deployment on `main` breaks:

```bash
# fast rollback (new revert commit)
git switch main
git pull --ff-only
git revert <bad_commit_sha>
git push
```

This keeps history honest and quickly restores production.

---

## Suggested Branch Naming

- `feat/<feature>`
- `fix/<bug>`
- `security/<topic>`
- `refactor/<area>`
- `docs/<topic>`
- `chore/<maintenance>`

Examples:

- `security/rate-limit-hardening`
- `feat/site-breadcrumbs`
- `fix/contact-validation`

