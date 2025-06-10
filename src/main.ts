// src/main.ts
import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { AdbService } from "./infrastructure/services/AdbService";
import { SqliteService } from "./infrastructure/services/SqliteService";
import { MainSettingRepository } from "./infrastructure/repositories/MainSettingRepository";
import { SettingService } from "./application/services/SettingService";

// Initialize services in main process
const adbService = new AdbService();
const sqliteService = new SqliteService();
const mainSettingRepository = new MainSettingRepository(sqliteService);
const settingService = new SettingService(mainSettingRepository);

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

// Initialize database when app is ready
app.whenReady().then(async () => {
  // Initialize the settings database
  try {
    await mainSettingRepository.initializeDatabase();
    console.log('Settings database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize settings database:', error);
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

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

// IPC Handlers for Settings operations
ipcMain.handle('settings:initialize', async () => {
  try {
    return await mainSettingRepository.initializeDatabase();
  } catch (error) {
    console.error('Error initializing settings database:', error);
    return false;
  }
});

ipcMain.handle('settings:getSetting', async (_, key: string) => {
  try {
    return await settingService.getSetting(key as any);
  } catch (error) {
    console.error('Error getting setting:', error);
    return null;
  }
});

ipcMain.handle('settings:updateSetting', async (_, key: string, value: string) => {
  try {
    return await settingService.updateSetting(key as any, value);
  } catch (error) {
    console.error('Error updating setting:', error);
    throw error;
  }
});

ipcMain.handle('settings:getAllSettings', async () => {
  try {
    return await settingService.getAllSettings();
  } catch (error) {
    console.error('Error getting all settings:', error);
    return [];
  }
});

ipcMain.handle('settings:deleteSetting', async (_, key: string) => {
  try {
    return await mainSettingRepository.deleteSetting(key as any);
  } catch (error) {
    console.error('Error deleting setting:', error);
    return false;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});