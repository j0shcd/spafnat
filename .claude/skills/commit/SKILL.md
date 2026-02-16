# Atomic Commit

Create a single logical commit with conventional commit message style.

## Instructions

1. **Review changes**: Check `git status` and `git diff` to understand what changed
2. **Stage related files only**: Use `git add` to stage ONLY files for this one logical change
3. **Write commit message**:
   - Format: `<type>: <short description>`
   - Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`
   - Keep under 72 characters
   - No "Co-Authored-By" footer
4. **Commit**: Run `git commit -m "<message>"`
5. **Update project docs** if needed:
   - If phase milestone reached → update MEMORY.md phase status
   - If new patterns/decisions → add to MEMORY.md Key Technical Decisions
   - If new bugs fixed → add to MEMORY.md Bugs Fixed

## Examples

```bash
# Good commits
git commit -m "feat: add admin login page with JWT auth"
git commit -m "fix: correct R2 key handling for documents"
git commit -m "chore: add post-edit hook for Node.js API detection"

# Bad commits (too broad)
git commit -m "update admin panel"  # Multiple changes
git commit -m "fixes"               # Vague
```

## Usage

```
/commit
```

Or with user-provided message:
```
/commit "fix: resolve delete endpoint 404 error"
```
