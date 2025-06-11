// src/preload.ts - Updated with data import APIs
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
  
  // File System APIs for temporary file operations
  fs: {
    writeTemporaryFile: (fileName: string, arrayBuffer: ArrayBuffer) => 
      ipcRenderer.invoke('fs:writeTemporaryFile', fileName, arrayBuffer),
    cleanupTemporaryFile: (filePath: string) => 
      ipcRenderer.invoke('fs:cleanupTemporaryFile', filePath),
  },
  
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

  // Settings-related APIs exposed via IPC
  settings: {
    initialize: () => ipcRenderer.invoke('settings:initialize'),
    getSetting: (key: string) => ipcRenderer.invoke('settings:getSetting', key),
    updateSetting: (key: string, value: string) => ipcRenderer.invoke('settings:updateSetting', key, value),
    getAllSettings: () => ipcRenderer.invoke('settings:getAllSettings'),
    deleteSetting: (key: string) => ipcRenderer.invoke('settings:deleteSetting', key),
  },

  // Data Import APIs exposed via IPC
  import: {
    parseFile: (filePath: string) => ipcRenderer.invoke('import:parseFile', filePath),
    importData: (csvData: any[], fileType: string) => ipcRenderer.invoke('import:importData', csvData, fileType),
    detectFileType: (headers: string[]) => ipcRenderer.invoke('import:detectFileType', headers),
  },

  // Data Query APIs exposed via IPC
  data: {
    getAllProducts: () => ipcRenderer.invoke('data:getAllProducts'),
    getAllLocations: () => ipcRenderer.invoke('data:getAllLocations'),
    getAllStaff: () => ipcRenderer.invoke('data:getAllStaff'),
    getAllSuppliers: () => ipcRenderer.invoke('data:getAllSuppliers'),
  }
});