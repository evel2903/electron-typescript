// src/preload.ts
import { contextBridge } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getVersions: () => ({
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  }),
  
  getPlatform: () => process.platform,
  
  // You can add more secure APIs here as needed
  // For example: file operations, system info, etc.
});