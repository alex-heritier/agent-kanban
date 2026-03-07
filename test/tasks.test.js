import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { tasksCreate, tasksList, tasksSetStatus, tasksReady, tasksLint } from '../src/tasks.js';

function mkRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kanban-'));
}

test('creates and updates tasks in TASKS.md', () => {
  const repo = mkRepo();
  const created = tasksCreate(repo, { title: 'Test task', status: 'todo' });
  assert.equal(created.id, 'TASK-1');

  const all = tasksList(repo);
  assert.equal(all.length, 1);
  assert.equal(all[0].title, 'Test task');

  tasksSetStatus(repo, 'TASK-1', 'done');
  const updated = tasksList(repo)[0];
  assert.equal(updated.metadata.Status, 'done');
});

test('ready query and lint', () => {
  const repo = mkRepo();
  tasksCreate(repo, { title: 'Ready task', status: 'todo', sections: { 'Next Action': '- Do: run tests' } });
  const ready = tasksReady(repo);
  assert.equal(ready.length, 1);

  const lint = tasksLint(repo);
  assert.equal(lint.ok, true);
});
