# Docs

`docs/index.html` hosts the TASKS.md Kanban board UI.

- In Electron, it uses `window.tasksApi` from preload to read/write `<repo>/TASKS.md`.
- In static browser mode (e.g. GitHub Pages), it runs as read-only demo shell because filesystem APIs are unavailable.

Columns map directly to task statuses:

- Todo (`todo`)
- In Progress (`in_progress`)
- Blocked (`blocked`)
- Done (`done`)
- Cancelled (`cancelled`)

## TASKS.md Format

The file must contain a `## Tasks` heading. Tasks live below it. Three levels of detail:

### Minimal (one-liner)

```markdown
- TASK-1 Fix the login bug
- TASK-2 Add dark mode
```

No metadata, no sections. Defaults to status `todo`, priority `medium`, owner `unassigned`.

### Standard (heading + metadata)

```markdown
### TASK-3 Implement OAuth
- Status: in_progress
- Priority: high
- Owner: alice
- Type: feature
- Created: 2026-03-08 17:41:10
- Updated: 2026-03-08 17:41:10
```

### Detailed (heading + metadata + sections)

```markdown
### TASK-4 Implement OAuth
- Status: in_progress
- Priority: high
- Owner: alice
- Type: feature
- Created: 2026-03-08 17:41:10
- Updated: 2026-03-08 17:41:10
- Files:
  - src/auth.js
- Depends on:
  - TASK-3

#### Description
OAuth2 integration with Google and GitHub providers.

#### Next Action
- Do: wire up token refresh

#### Progress Notes
- 2026-03-08 18:00:00 Started OAuth flow
```

### Rules

- IDs auto-increment. Do not renumber manually.
- Do not reorder tasks. Append new tasks to the end.
- Timestamps use `YYYY-MM-DD HH:MM:SS` (24h).
- Allowed statuses: `todo`, `in_progress`, `blocked`, `done`, `cancelled`.
- Allowed priorities: `high`, `medium`, `low`.
- `Files` and `Depends on` can be multi-line lists (`- ` prefix).
