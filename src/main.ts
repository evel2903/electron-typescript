// src/main.ts - Updated with database support
import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { AdbService } from "./infrastructure/services/AdbService";
import { DatabaseService } from "./infrastructure/services/DatabaseService";
import { Setting } from "./domain/entities/Setting";

// Initialize services in main process
const adbService = new AdbService();
const databaseService = DatabaseService.getInstance();

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

// Database initialization and IPC handlers
async function initializeDatabase() {
  try {
    await databaseService.initialize();
    console.log('Database service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database service:', error);
  }
}

// Database IPC Handlers
ipcMain.handle('database:initializeDatabase', async () => {
  try {
    await databaseService.initialize();
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
});

ipcMain.handle('database:getAllSettings', async (): Promise<Setting[]> => {
  try {
    const db = databaseService.getDatabase();
    const stmt = db.prepare('SELECT key, value, created_at, updated_at FROM sys_setting ORDER BY key');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      key: row.key,
      value: row.value,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  } catch (error) {
    console.error('Error getting all settings:', error);
    return [];
  }
});

ipcMain.handle('database:getSettingByKey', async (_, key: string): Promise<Setting | null> => {
  try {
    const db = databaseService.getDatabase();
    const stmt = db.prepare('SELECT key, value, created_at, updated_at FROM sys_setting WHERE key = ?');
    const row = stmt.get(key) as any;
    
    if (!row) return null;
    
    return {
      key: row.key,
      value: row.value,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  } catch (error) {
    console.error('Error getting setting by key:', error);
    return null;
  }
});

ipcMain.handle('database:createSetting', async (_, key: string, value: string): Promise<Setting> => {
  try {
    const db = databaseService.getDatabase();
    const stmt = db.prepare('INSERT INTO sys_setting (key, value) VALUES (?, ?)');
    stmt.run(key, value);
    
    const selectStmt = db.prepare('SELECT key, value, created_at, updated_at FROM sys_setting WHERE key = ?');
    const row = selectStmt.get(key) as any;
    
    return {
      key: row.key,
      value: row.value,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  } catch (error) {
    console.error('Error creating setting:', error);
    throw error;
  }
});

ipcMain.handle('database:updateSetting', async (_, key: string, value: string): Promise<Setting> => {
  try {
    const db = databaseService.getDatabase();
    const stmt = db.prepare('UPDATE sys_setting SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?');
    const result = stmt.run(value, key);
    
    if (result.changes === 0) {
      throw new Error(`Setting with key '${key}' not found`);
    }
    
    const selectStmt = db.prepare('SELECT key, value, created_at, updated_at FROM sys_setting WHERE key = ?');
    const row = selectStmt.get(key) as any;
    
    return {
      key: row.key,
      value: row.value,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  } catch (error) {
    console.error('Error updating setting:', error);
    throw error;
  }
});

ipcMain.handle('database:upsertSetting', async (_, key: string, value: string): Promise<Setting> => {
  try {
    const db = databaseService.getDatabase();
    const stmt = db.prepare(`
      INSERT INTO sys_setting (key, value) 
      VALUES (?, ?) 
      ON CONFLICT(key) DO UPDATE SET 
        value = excluded.value, 
        updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(key, value);
    
    const selectStmt = db.prepare('SELECT key, value, created_at, updated_at FROM sys_setting WHERE key = ?');
    const row = selectStmt.get(key) as any;
    
    return {
      key: row.key,
      value: row.value,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  } catch (error) {
    console.error('Error upserting setting:', error);
    throw error;
  }
});

ipcMain.handle('database:deleteSetting', async (_, key: string): Promise<boolean> => {
  try {
    const db = databaseService.getDatabase();
    const stmt = db.prepare('DELETE FROM sys_setting WHERE key = ?');
    const result = stmt.run(key);
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting setting:', error);
    return false;
  }
});

// ADB IPC Handlers (existing handlers remain unchanged)
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

app.whenReady().then(async () => {
  await initializeDatabase();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  databaseService.close();
  if (process.platform !== "darwin") {
    app.quit();
  }
});