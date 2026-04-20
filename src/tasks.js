import fs from 'node:fs';
import path from 'node:path';

const TASK_HEADING_RE = /^### (TASK-(\d+)) (.+)$/;
const TASK_ONE_LINER_RE = /^- (TASK-(\d+)) (.+)$/;
const METADATA_RE = /^- ([A-Za-z][A-Za-z ]*):\s*(.*)$/;
const SECTION_RE = /^#### (Description|Acceptance Criteria|Next Action|Progress Notes|Agent Log)$/;
const TS_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const ALLOWED_STATUS = new Set(['todo', 'in_progress', 'blocked', 'done', 'cancelled']);
const META_ORDER = ['Status', 'Priority', 'Owner', 'Type', 'Created', 'Updated', 'Files', 'Depends on'];
const SECTION_ORDER = ['Description', 'Acceptance Criteria', 'Next Action', 'Progress Notes', 'Agent Log'];

function nowTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function ensureTasksFile(repoRoot) {
  const fp = path.join(repoRoot, 'TASKS.md');
  if (!fs.existsSync(fp)) {
    const content = '# TASKS.md\n\n## Guidelines\nThis repository tracks work using TASKS.md.\n\n## Tasks\n';
    fs.writeFileSync(fp, content, 'utf8');
  }
  return fp;
}

function splitLinesWithOffsets(text) {
  const lines = text.split('\n');
  const offsets = [];
  let current = 0;
  for (const line of lines) {
    offsets.push(current);
    current += line.length + 1;
  }
  return { lines, offsets };
}

function isMinimalTask(task) {
  const hasTimestamp = task.metadata.Created || task.metadata.Updated;
  const hasSections = Object.keys(task.sections).length > 0;
  return !hasTimestamp && !hasSections;
}

export function parseTasks(content) {
  const tasksHeader = /^## Tasks\s*$/m;
  const m = content.match(tasksHeader);
  if (!m || m.index == null) throw new Error('TASKS.md must include a "## Tasks" section exactly once.');
  const tasksPos = m.index;
  const tasksLineEnd = content.indexOf('\n', tasksPos);
  const taskAreaStart = tasksLineEnd >= 0 ? tasksLineEnd + 1 : content.length;

  const { lines, offsets } = splitLinesWithOffsets(content);
  const taskStartLine = lines.findIndex((l) => /^## Tasks\s*$/.test(l));
  const taskBlocks = [];
  let i = taskStartLine + 1;

  while (i < lines.length) {
    if (!lines[i].trim()) {
      i += 1;
      continue;
    }

    const ol = lines[i].match(TASK_ONE_LINER_RE);
    if (ol) {
      taskBlocks.push({
        id: ol[1],
        idNumber: Number(ol[2]),
        title: ol[3],
        metadata: {},
        sections: {},
        raw: lines[i],
        startOffset: offsets[i],
        endOffset: offsets[i] + lines[i].length,
      });
      i += 1;
      continue;
    }

    const hm = lines[i].match(TASK_HEADING_RE);
    if (!hm) {
      i += 1;
      continue;
    }
    const startLine = i;
    let endLine = i;
    i += 1;
    while (i < lines.length && !TASK_HEADING_RE.test(lines[i]) && !TASK_ONE_LINER_RE.test(lines[i])) {
      endLine = i;
      i += 1;
    }

    const raw = lines.slice(startLine, endLine + 1).join('\n').trimEnd();
    const [_, id, idNum, title] = hm;
    const metadata = {};
    const sections = {};
    let cursor = startLine + 1;
    while (cursor <= endLine) {
      const line = lines[cursor];
      const mm = line.match(METADATA_RE);
      if (mm) {
        const key = mm[1];
        let value = mm[2];
        if ((key === 'Files' || key === 'Depends on') && value === '') {
          const items = [];
          let c = cursor + 1;
          while (c <= endLine && /^\s{2,}-\s+/.test(lines[c])) {
            items.push(lines[c].replace(/^\s{2,}-\s+/, ''));
            c += 1;
          }
          value = items.join('\n');
          cursor = c;
          metadata[key] = value;
          continue;
        }
        metadata[key] = value;
        cursor += 1;
        continue;
      }
      const sm = line.match(SECTION_RE);
      if (sm) {
        const name = sm[1];
        const body = [];
        cursor += 1;
        while (cursor <= endLine && !SECTION_RE.test(lines[cursor])) {
          body.push(lines[cursor]);
          cursor += 1;
        }
        sections[name] = body.join('\n').trimEnd();
        continue;
      }
      cursor += 1;
    }

    taskBlocks.push({
      id,
      idNumber: Number(idNum),
      title,
      metadata,
      sections,
      raw,
      startOffset: offsets[startLine],
      endOffset: offsets[endLine] + lines[endLine].length,
    });
  }

  return {
    preTasks: content.slice(0, taskAreaStart),
    taskAreaStart,
    tasks: taskBlocks,
    content,
  };
}

function renderTask(task) {
  if (isMinimalTask(task)) {
    return `- ${task.id} ${task.title}`;
  }

  const lines = [`### ${task.id} ${task.title}`, ''];
  const normalizedMeta = { ...task.metadata };
  if (!normalizedMeta.Priority) normalizedMeta.Priority = 'medium';
  if (!normalizedMeta.Owner) normalizedMeta.Owner = 'unassigned';

  for (const key of META_ORDER) {
    const val = normalizedMeta[key];
    if (val != null && val !== '') {
      if ((key === 'Files' || key === 'Depends on') && String(val).includes('\n')) {
        lines.push(`- ${key}:`);
        for (const entry of String(val).split('\n').map((x) => x.trim()).filter(Boolean)) {
          lines.push(`  - ${entry}`);
        }
      } else {
        lines.push(`- ${key}: ${val}`);
      }
    }
  }
  for (const [k, v] of Object.entries(normalizedMeta)) {
    if (!META_ORDER.includes(k) && v != null && v !== '') lines.push(`- ${k}: ${v}`);
  }

  for (const sec of SECTION_ORDER) {
    if (task.sections[sec] != null && task.sections[sec] !== '') {
      lines.push('', `#### ${sec}`);
      lines.push(task.sections[sec]);
    }
  }
  for (const [k, v] of Object.entries(task.sections)) {
    if (!SECTION_ORDER.includes(k) && v != null && v !== '') {
      lines.push('', `#### ${k}`);
      lines.push(v);
    }
  }

  return lines.join('\n').trimEnd();
}

function writeParsed(repoRoot, parsed, updatedTasks, mode = 'replace_all') {
  const fp = ensureTasksFile(repoRoot);
  const existing = fs.readFileSync(fp, 'utf8');
  if (mode === 'replace_all') {
    const body = updatedTasks.map(renderTask).join('\n\n');
    const out = `${parsed.preTasks}${body}${body ? '\n' : ''}`;
    fs.writeFileSync(fp, out, 'utf8');
    return;
  }
  fs.writeFileSync(fp, existing, 'utf8');
}

export function loadTasks(repoRoot) {
  const fp = ensureTasksFile(repoRoot);
  return parseTasks(fs.readFileSync(fp, 'utf8'));
}

export function tasksList(repoRoot) {
  return loadTasks(repoRoot).tasks;
}

export function tasksGet(repoRoot, id) {
  return tasksList(repoRoot).find((t) => t.id === id) ?? null;
}

function validateTask(task, allTasks) {
  const errs = [];
  const hasAnyMeta = Object.keys(task.metadata).length > 0;
  if (hasAnyMeta && !task.metadata.Status) errs.push(`${task.id}: missing Status`);
  if (task.metadata.Status && !ALLOWED_STATUS.has(task.metadata.Status)) errs.push(`${task.id}: invalid Status ${task.metadata.Status}`);
  if (task.metadata.Priority && !['high', 'medium', 'low'].includes(task.metadata.Priority)) errs.push(`${task.id}: invalid Priority ${task.metadata.Priority}`);
  if (task.metadata.Created && !TS_RE.test(task.metadata.Created)) errs.push(`${task.id}: invalid Created timestamp`);
  if (task.metadata.Updated && !TS_RE.test(task.metadata.Updated)) errs.push(`${task.id}: invalid Updated timestamp`);
  const deps = (task.metadata['Depends on'] || '')
    .split('\n')
    .map((x) => x.trim().replace(/^-\s*/, ''))
    .filter(Boolean);
  for (const dep of deps) {
    if (!/^TASK-\d+$/.test(dep)) errs.push(`${task.id}: invalid dependency ${dep}`);
    else if (!allTasks.some((t) => t.id === dep)) errs.push(`${task.id}: missing dependency ${dep}`);
  }
  return errs;
}

function detectCircular(tasks) {
  const graph = new Map();
  for (const t of tasks) {
    const deps = String(t.metadata['Depends on'] ?? '')
      .split('\n')
      .map((x) => x.trim().replace(/^-\s*/, ''))
      .filter((x) => /^TASK-\d+$/.test(x));
    graph.set(t.id, deps);
  }
  const visiting = new Set();
  const visited = new Set();
  const cycles = [];
  function dfs(node, stack) {
    if (visiting.has(node)) {
      const idx = stack.indexOf(node);
      cycles.push(stack.slice(idx).concat(node).join(' -> '));
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node);
    stack.push(node);
    for (const n of graph.get(node) || []) dfs(n, stack);
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  }
  for (const n of graph.keys()) dfs(n, []);
  return cycles;
}

export function tasksLint(repoRoot) {
  const parsed = loadTasks(repoRoot);
  const errors = [];
  const ids = new Set();
  for (const t of parsed.tasks) {
    if (ids.has(t.id)) errors.push(`duplicate id ${t.id}`);
    ids.add(t.id);
    errors.push(...validateTask(t, parsed.tasks));
  }
  for (const c of detectCircular(parsed.tasks)) errors.push(`circular dependency: ${c}`);
  return { ok: errors.length === 0, errors };
}

function nextId(tasks) {
  const max = tasks.reduce((m, t) => Math.max(m, t.idNumber), 0);
  return `TASK-${max + 1}`;
}

export function tasksCreate(repoRoot, input) {
  const parsed = loadTasks(repoRoot);
  const ts = nowTimestamp();
  const task = {
    id: nextId(parsed.tasks),
    title: input.title,
    metadata: {
      Status: input.status ?? 'todo',
      Priority: input.priority ?? 'medium',
      Owner: input.owner ?? 'unassigned',
      Type: input.type ?? '',
      Created: ts,
      Updated: ts,
    },
    sections: input.sections ?? {},
  };
  writeParsed(repoRoot, parsed, [...parsed.tasks, task]);
  return task;
}

export function tasksUpdate(repoRoot, id, patch) {
  const parsed = loadTasks(repoRoot);
  let updated = null;
  const ts = nowTimestamp();
  const tasks = parsed.tasks.map((t) => {
    if (t.id !== id) return t;
    updated = {
      ...t,
      title: patch.title ?? t.title,
      metadata: { ...t.metadata, ...(patch.metadata || {}), Updated: ts },
      sections: { ...t.sections, ...(patch.sections || {}) },
    };
    return updated;
  });
  if (!updated) throw new Error(`Task not found: ${id}`);
  writeParsed(repoRoot, parsed, tasks);
  return updated;
}

export function tasksSetStatus(repoRoot, id, status) {
  return tasksUpdate(repoRoot, id, { metadata: { Status: status } });
}

export function tasksSetOwner(repoRoot, id, owner) {
  return tasksUpdate(repoRoot, id, { metadata: { Owner: owner } });
}

export function tasksAddNote(repoRoot, id, note) {
  const t = tasksGet(repoRoot, id);
  if (!t) throw new Error(`Task not found: ${id}`);
  const existing = t.sections['Progress Notes'] || '';
  const prefix = existing ? `${existing}\n` : '';
  return tasksUpdate(repoRoot, id, { sections: { 'Progress Notes': `${prefix}- ${nowTimestamp()} ${note}` } });
}

export function tasksCancel(repoRoot, id, reason = 'Cancelled') {
  return tasksUpdate(repoRoot, id, { metadata: { Status: 'cancelled' }, sections: { 'Progress Notes': `${reason}` } });
}

export function tasksReady(repoRoot) {
  const parsed = loadTasks(repoRoot);
  const byId = new Map(parsed.tasks.map((t) => [t.id, t]));
  const depDone = (t) => {
    const depRaw = t.metadata['Depends on'] || '';
    const deps = depRaw.split('\n').map((x) => x.trim().replace(/^-\s*/, '')).filter(Boolean);
    return deps.every((id) => byId.get(id)?.metadata?.Status === 'done');
  };
  return parsed.tasks.filter((t) => t.metadata.Status === 'todo' && (t.metadata.Owner || 'unassigned') === 'unassigned' && !!t.sections['Next Action'] && depDone(t));
}

export function tasksFindByFile(repoRoot, relPath) {
  return tasksList(repoRoot).filter((t) => {
    const files = t.metadata.Files || '';
    return files.split('\n').some((line) => line.includes(relPath));
  });
}

export function tasksArchive(repoRoot, ids) {
  const parsed = loadTasks(repoRoot);
  const archiveDir = path.join(repoRoot, '.kanban');
  const archiveFile = path.join(archiveDir, 'TASKS.archive.md');
  fs.mkdirSync(archiveDir, { recursive: true });
  const moving = parsed.tasks.filter((t) => ids.includes(t.id));
  const staying = parsed.tasks.filter((t) => !ids.includes(t.id));
  const append = moving.map(renderTask).join('\n\n');
  if (append) fs.appendFileSync(archiveFile, `${append}\n\n`, 'utf8');
  writeParsed(repoRoot, parsed, staying);
  return moving;
}

export function tasksFix(repoRoot) {
  const parsed = loadTasks(repoRoot);
  const fixed = parsed.tasks.map((t) => {
    const metadata = { ...t.metadata };
    if (!metadata.Priority) metadata.Priority = 'medium';
    if (!metadata.Owner) metadata.Owner = 'unassigned';
    if (!metadata.Created) metadata.Created = nowTimestamp();
    metadata.Updated = nowTimestamp();
    return { ...t, metadata };
  });
  writeParsed(repoRoot, parsed, fixed);
  return tasksLint(repoRoot);
}
