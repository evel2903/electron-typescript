// src/main.ts
import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { AdbService } from "./infrastructure/services/AdbService";

// Initialize ADB service in main process
const adbService = new AdbService();

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'default',
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, "../index.html"));

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// IPC Handlers for Android Device operations
ipcMain.handle('adb:isAvailable', async () => {
  try {
    return await adbService.isAdbAvailable();
  } catch (error) {
    console.error('Error checking ADB availability:', error);
    return false;
  }
});

ipcMain.handle('adb:listDevices', async () => {
  try {
    return await adbService.listDevices();
  } catch (error) {
    console.error('Error listing devices:', error);
    return [];
  }
});

ipcMain.handle('adb:getDeviceInfo', async (_, deviceId: string) => {
  try {
    return await adbService.getDeviceInfo(deviceId);
  } catch (error) {
    console.error('Error getting device info:', error);
    return null;
  }
});

ipcMain.handle('adb:authorizeDevice', async (_, deviceId: string) => {
  try {
    return await adbService.authorizeDevice(deviceId);
  } catch (error) {
    console.error('Error authorizing device:', error);
    return false;
  }
});

ipcMain.handle('adb:listFiles', async (_, deviceId: string, path: string) => {
  try {
    return await adbService.listFiles(deviceId, path);
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
});

ipcMain.handle('adb:pullFile', async (_, deviceId: string, remotePath: string, localPath: string) => {
  try {
    return await adbService.pullFile(deviceId, remotePath, localPath);
  } catch (error) {
    console.error('Error pulling file:', error);
    return {
      success: false,
      message: 'Failed to transfer file from device',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

ipcMain.handle('adb:pushFile', async (_, deviceId: string, localPath: string, remotePath: string) => {
  try {
    return await adbService.pushFile(deviceId, localPath, remotePath);
  } catch (error) {
    console.error('Error pushing file:', error);
    return {
      success: false,
      message: 'Failed to transfer file to device',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

ipcMain.handle('adb:createDirectory', async (_, deviceId: string, path: string) => {
  try {
    return await adbService.createDirectory(deviceId, path);
  } catch (error) {
    console.error('Error creating directory:', error);
    return false;
  }
});

ipcMain.handle('adb:deleteFile', async (_, deviceId: string, path: string) => {
  try {
    return await adbService.deleteFile(deviceId, path);
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});