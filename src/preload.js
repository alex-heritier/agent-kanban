import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('appInfo', {
  name: 'agent-kanban',
  version: '0.1.0'
});
