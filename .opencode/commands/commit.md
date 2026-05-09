---
description: Safely create a git commit after checking secrets, .gitignore, staged/unstaged changes, and commit-message intent.
agent: orchestrator
---

Use a todo list because committing safely requires inspection, security checks, staging, commit creation, and verification.

Create a git commit using this message or message intent: $ARGUMENTS

Required safety workflow:
1. Inspect repository state with non-destructive git commands:
   - `git status --short`
   - `git diff --stat`
   - `git diff`
   - `git diff --staged`
   - `git log --oneline -5`
2. Inspect ignore rules without printing secrets:
   - verify `.env`, `.env.*`, `mobile/.env`, credential files, keys, local databases, generated builds, caches, and dependency folders are ignored or not staged.
   - prefer reading `.gitignore` and safe example files such as `.env.example`; never read real `.env` files.
3. Search changed and untracked file names for sensitive patterns before staging:
   - `.env`, `secret`, `token`, `credential`, `password`, `private`, `firebase`, `.pem`, `.key`, `.p12`, `.sqlite`, `.db`.
   - If any suspicious file appears, stop and ask the user instead of committing it.
4. Review actual changes and classify them:
   - code, docs, OpenCode config, tests, infra, generated files, secrets risk, unrelated user work.
   - Do not revert, overwrite, or remove user changes.
5. Stage only relevant files for the requested commit.
   - Do not stage real `.env`, credentials, private keys, production configs, local DBs, caches, `node_modules`, build outputs, or unrelated user changes.
   - If the working tree contains unrelated changes, leave them unstaged and clearly report them.
6. Create the commit with a concise message.
   - If `$ARGUMENTS` is empty, draft a message from the inspected diff and ask the user before committing.
   - If `$ARGUMENTS` is provided, use it only if it accurately reflects the staged changes; otherwise propose a safer message and ask.
   - Do not use `--no-verify`, `--no-gpg-sign`, `--amend`, force push, reset, checkout, or destructive git commands.
7. If hooks fail:
   - Do not amend.
   - Report the hook failure and fix only relevant issues if safe.
   - Create a new commit attempt only after fixes are staged and verified.
8. Verify after commit:
   - `git status --short`
   - `git log -1 --oneline`

Security hard stops:
- Stop before committing if real secrets, credentials, private keys, tokens, or unignored `.env` files are detected.
- Stop before committing if `.gitignore` appears to allow sensitive local files.
- Stop before committing if the staged diff contains obvious secrets or production credentials.
- Stop before committing if requested files are outside the project goal or likely belong to another user's concurrent work.

Deliver:
- Safety checks performed.
- Files staged and committed.
- Commit hash and message.
- Files intentionally left unstaged.
- Any warnings or follow-up actions.
