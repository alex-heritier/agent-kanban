# agent-kanban

Repo-native TASKS.md Kanban application.

## What this implements

- `TASKS.md` in repo root is the single source of truth for tasks.
- `.kanban/TASKS.archive.md` is used for archived tasks.
- Task operations are file-based and deterministic (no DB).
- Electron IPC exposes TASKS operations that mirror MCP-style methods:
  - `tasks_list`, `tasks_ready`, `tasks_get`, `tasks_create`, `tasks_update`
  - `tasks_set_status`, `tasks_set_owner`, `tasks_add_note`, `tasks_cancel`, `tasks_find_by_file`
  - `tasks lint/doctor/fix` style checks.
- Kanban UI in `docs/index.html` renders statuses and supports drag/drop status changes.

## Getting started

```bash
npm install
npm start
```

The Electron window loads `docs/index.html` and can read/write `TASKS.md` via preload IPC.
