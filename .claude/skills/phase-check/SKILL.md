# Phase Check

Verify current project phase status by reading actual code, not just plans.

## Instructions

1. Read all files in `.claude/CLAUDE.md` and memory files in `~/.claude/projects/.../memory/`
2. List each phase (Phase 1, 2, 3a, 3b, 3c, etc.) and its documented status
3. **Verify implementation** by checking for real code:
   - Read actual source files mentioned in phase descriptions
   - Check if endpoints/pages/components exist
   - Look for test files if testing is claimed
4. Compare documented status vs. actual implementation
5. Summarize what's next based on current state
6. **CRITICAL**: Do NOT mark anything as complete unless:
   - Code files exist and contain the claimed functionality
   - Tests pass (if applicable)
   - User has confirmed it works

## Output Format

```
PHASE STATUS REPORT
==================

Phase 1: [Name]
  Status: ✅ Complete / ⚠️ In Progress / ❌ Not Started
  Verified: [What was checked]

Phase 2: [Name]
  Status: [...]
  Verified: [...]

...

NEXT STEPS:
- [ ] [What needs to be done next]
- [ ] [...]

WARNINGS (if any):
- Phase X marked complete but missing [component]
```

## Usage

```
/phase-check
```
