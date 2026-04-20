# AGENTS.md

Electron app — tasks stored in `TASKS.md` (repo-native Kanban). Core logic in `src/tasks.js`.

## Commands

```bash
npm install
npm start              # launch Electron
npm test               # all tests (node --test)
node --test test/tasks.test.js                          # single file
node --test --test-name-pattern="creates and updates"   # single test by name
```

No linter or type checker configured.

## Code Style

- ESM only (`"type": "module"`). `import`/`export`, never `require`.
- Node builtins: `node:` prefix (`import fs from 'node:fs'`).
- Local imports: `.js` extension required (`'./tasks.js'`, not `'./tasks'`).
- Single quotes, semicolons, 2-space indent.
- `camelCase` vars/functions. `UPPER_SNAKE_CASE` for module-level constants.
- Named exports. Verb-first functions (`tasksCreate`, `parseTasks`).
- `throw new Error(msg)` for failures; return `null` for not-found lookups.
- Prefer `const`, `??`, `?.`, array methods over loops.
- Regex constants at module top, not inline.

## Testing

- Framework: `node:test` + `node:assert/strict`. Test files: `test/<module>.test.js`.
- Temp dirs: `fs.mkdtempSync(path.join(os.tmpdir(), 'kanban-'))`.
- Assert with `assert.equal`, `assert.ok`, `assert.throws`. Independent tests, no shared state.

## Task Format

Tasks under `## Tasks` support three detail levels. See `docs/README.md` for full spec.

- **One-liner**: `- TASK-1 Title` — no metadata, defaults to todo/medium/unassigned.
- **Heading**: `### TASK-2 Title` + metadata fields (Status, Priority, Owner, etc.).
- **Detailed**: heading + metadata + sections (`#### Description`, `#### Next Action`, etc.).

Append new tasks. Never reorder. IDs auto-increment.

## Conventions

- `repoRoot` is always first arg to task functions.
- New IPC: add export to `tasks.js`, handler in `main.js`, bridge in `preload.js`, test.
- Run `npm test` before handing off.
- No comments in code unless asked. Keep files <500 LOC.
