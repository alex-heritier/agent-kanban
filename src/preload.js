import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('appInfo', {
  name: 'agent-kanban',
  version: '0.1.0'
});

contextBridge.exposeInMainWorld('tasksApi', {
  list: () => ipcRenderer.invoke('tasks:list'),
  ready: () => ipcRenderer.invoke('tasks:ready'),
  get: (id) => ipcRenderer.invoke('tasks:get', id),
  create: (input) => ipcRenderer.invoke('tasks:create', input),
  update: (id, patch) => ipcRenderer.invoke('tasks:update', id, patch),
  setStatus: (id, status) => ipcRenderer.invoke('tasks:setStatus', id, status),
  setOwner: (id, owner) => ipcRenderer.invoke('tasks:setOwner', id, owner),
  addNote: (id, note) => ipcRenderer.invoke('tasks:addNote', id, note),
  cancel: (id, reason) => ipcRenderer.invoke('tasks:cancel', id, reason),
  findByFile: (relPath) => ipcRenderer.invoke('tasks:findByFile', relPath),
  archive: (ids) => ipcRenderer.invoke('tasks:archive', ids),
  lint: () => ipcRenderer.invoke('tasks:lint'),
  doctor: () => ipcRenderer.invoke('tasks:doctor'),
  fix: () => ipcRenderer.invoke('tasks:fix')
});
