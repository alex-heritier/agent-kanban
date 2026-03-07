# TASKS.md

## Guidelines

This repository tracks work using TASKS.md as the source of truth.

Coding agents should prefer using the Kanban MCP server when available and fall back to editing TASKS.md directly when MCP is unavailable.

Do not reorder tasks. Append new tasks to the end of the ## Tasks section.

## Tasks

### TASK-1 Implement TASKS.md Kanban specification

- Status: in_progress
- Priority: high
- Owner: agent-gpt
- Type: feature
- Created: 2026-03-08 17:41:10
- Updated: 2026-03-08 17:41:10
- Files:
  - src/main.js
  - src/preload.js
  - src/tasks.js
  - docs/index.html

#### Description
Implement repo-native TASKS.md parsing/editing, Electron bridge operations, and Kanban UI behavior aligned to the product and technical specification.

#### Next Action
- Do: finalize lint/fix and docs updates
- Verify: run test checks and smoke-validate file parsing
- Touch:
  - README.md
  - src/tasks.js
- Blocked By: none

#### Progress Notes
- Initial scaffold reviewed and feature implementation in progress.
