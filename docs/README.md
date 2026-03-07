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
