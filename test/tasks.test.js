import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { tasksCreate, tasksList, tasksSetStatus, tasksReady, tasksLint, parseTasks } from '../src/tasks.js';

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

test('parses one-liner task format', () => {
  const content = '# TASKS.md\n\n## Guidelines\n\n## Tasks\n\n- TASK-1 Fix the login bug\n- TASK-2 Add dark mode\n';
  const parsed = parseTasks(content);
  assert.equal(parsed.tasks.length, 2);
  assert.equal(parsed.tasks[0].id, 'TASK-1');
  assert.equal(parsed.tasks[0].title, 'Fix the login bug');
  assert.equal(parsed.tasks[1].id, 'TASK-2');
  assert.equal(parsed.tasks[1].title, 'Add dark mode');
});

test('round-trips one-liner format', () => {
  const content = '# TASKS.md\n\n## Guidelines\n\n## Tasks\n\n- TASK-1 Fix the login bug\n- TASK-2 Add dark mode\n';
  const parsed = parseTasks(content);
  const rendered = parsed.tasks.map((t) => `- ${t.id} ${t.title}`).join('\n');
  assert.equal(rendered, '- TASK-1 Fix the login bug\n- TASK-2 Add dark mode');
});

test('mixes one-liner and heading formats', () => {
  const content = [
    '# TASKS.md',
    '',
    '## Guidelines',
    '',
    '## Tasks',
    '',
    '- TASK-1 Quick fix',
    '',
    '### TASK-2 Detailed task',
    '- Status: todo',
    '- Priority: high',
    '',
    '- TASK-3 Another quick one',
  ].join('\n');
  const parsed = parseTasks(content);
  assert.equal(parsed.tasks.length, 3);
  assert.equal(parsed.tasks[0].id, 'TASK-1');
  assert.deepEqual(parsed.tasks[0].metadata, {});
  assert.equal(parsed.tasks[1].id, 'TASK-2');
  assert.equal(parsed.tasks[1].metadata.Status, 'todo');
  assert.equal(parsed.tasks[2].id, 'TASK-3');
  assert.deepEqual(parsed.tasks[2].metadata, {});
});

test('lint passes with one-liner tasks', () => {
  const repo = mkRepo();
  const fp = path.join(repo, 'TASKS.md');
  fs.writeFileSync(fp, '# TASKS.md\n\n## Guidelines\n\n## Tasks\n\n- TASK-1 Quick fix\n- TASK-2 Another one\n', 'utf8');
  const lint = tasksLint(repo);
  assert.equal(lint.ok, true);
  assert.equal(lint.errors.length, 0);
});
