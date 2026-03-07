import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  tasksAddNote,
  tasksArchive,
  tasksCancel,
  tasksCreate,
  tasksFindByFile,
  tasksFix,
  tasksGet,
  tasksLint,
  tasksList,
  tasksReady,
  tasksSetOwner,
  tasksSetStatus,
  tasksUpdate,
} from './tasks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 840,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(path.join(__dirname, '..', 'docs', 'index.html'));
}

const repoRoot = path.join(__dirname, '..');

function registerTaskIpc() {
  ipcMain.handle('tasks:list', () => tasksList(repoRoot));
  ipcMain.handle('tasks:ready', () => tasksReady(repoRoot));
  ipcMain.handle('tasks:get', (_e, id) => tasksGet(repoRoot, id));
  ipcMain.handle('tasks:create', (_e, input) => tasksCreate(repoRoot, input));
  ipcMain.handle('tasks:update', (_e, id, patch) => tasksUpdate(repoRoot, id, patch));
  ipcMain.handle('tasks:setStatus', (_e, id, status) => tasksSetStatus(repoRoot, id, status));
  ipcMain.handle('tasks:setOwner', (_e, id, owner) => tasksSetOwner(repoRoot, id, owner));
  ipcMain.handle('tasks:addNote', (_e, id, note) => tasksAddNote(repoRoot, id, note));
  ipcMain.handle('tasks:cancel', (_e, id, reason) => tasksCancel(repoRoot, id, reason));
  ipcMain.handle('tasks:findByFile', (_e, relPath) => tasksFindByFile(repoRoot, relPath));
  ipcMain.handle('tasks:archive', (_e, ids) => tasksArchive(repoRoot, ids));
  ipcMain.handle('tasks:lint', () => tasksLint(repoRoot));
  ipcMain.handle('tasks:doctor', () => tasksLint(repoRoot));
  ipcMain.handle('tasks:fix', () => tasksFix(repoRoot));
}

app.whenReady().then(() => {
  registerTaskIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
