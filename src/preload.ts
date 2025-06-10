// src/preload.ts - Updated with database API
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getVersions: () => ({
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  }),
  
  getPlatform: () => process.platform,
  
  // ADB-related APIs exposed via IPC
  adb: {
    isAvailable: () => ipcRenderer.invoke('adb:isAvailable'),
    listDevices: () => ipcRenderer.invoke('adb:listDevices'),
    getDeviceInfo: (deviceId: string) => ipcRenderer.invoke('adb:getDeviceInfo', deviceId),
    authorizeDevice: (deviceId: string) => ipcRenderer.invoke('adb:authorizeDevice', deviceId),
    listFiles: (deviceId: string, path: string) => ipcRenderer.invoke('adb:listFiles', deviceId, path),
    pullFile: (deviceId: string, remotePath: string, localPath: string) => 
      ipcRenderer.invoke('adb:pullFile', deviceId, remotePath, localPath),
    pushFile: (deviceId: string, localPath: string, remotePath: string) => 
      ipcRenderer.invoke('adb:pushFile', deviceId, localPath, remotePath),
    createDirectory: (deviceId: string, path: string) => 
      ipcRenderer.invoke('adb:createDirectory', deviceId, path),
    deleteFile: (deviceId: string, path: string) => 
      ipcRenderer.invoke('adb:deleteFile', deviceId, path),
  },

  // Database-related APIs exposed via IPC
  database: {
    initializeDatabase: () => ipcRenderer.invoke('database:initializeDatabase'),
    getAllSettings: () => ipcRenderer.invoke('database:getAllSettings'),
    getSettingByKey: (key: string) => ipcRenderer.invoke('database:getSettingByKey', key),
    createSetting: (key: string, value: string) => ipcRenderer.invoke('database:createSetting', key, value),
    updateSetting: (key: string, value: string) => ipcRenderer.invoke('database:updateSetting', key, value),
    upsertSetting: (key: string, value: string) => ipcRenderer.invoke('database:upsertSetting', key, value),
    deleteSetting: (key: string) => ipcRenderer.invoke('database:deleteSetting', key),
  }
});