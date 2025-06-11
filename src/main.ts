// src/main.ts - Updated with data synchronization functionality
import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { AdbService } from "./infrastructure/services/AdbService";
import { SqliteService } from "./infrastructure/services/SqliteService";
import { FileParserService } from "./infrastructure/services/FileParserService";
import { DataSyncService } from "./infrastructure/services/DataSyncService";
import { MainSettingRepository } from "./infrastructure/repositories/MainSettingRepository";
import { ProductRepository } from "./infrastructure/repositories/ProductRepository";
import { LocationRepository } from "./infrastructure/repositories/LocationRepository";
import { StaffRepository } from "./infrastructure/repositories/StaffRepository";
import { SupplierRepository } from "./infrastructure/repositories/SupplierRepository";
import { InventoryDataRepository } from "./infrastructure/repositories/InventoryDataRepository";
import { StockinDataRepository } from "./infrastructure/repositories/StockinDataRepository";
import { StockoutDataRepository } from "./infrastructure/repositories/StockoutDataRepository";
import { SettingService } from "./application/services/SettingService";
import { DataImportService } from "./application/services/DataImportService";

// Initialize services in main process
const adbService = new AdbService();
const sqliteService = new SqliteService();
const fileParserService = new FileParserService();
const dataSyncService = new DataSyncService(adbService, sqliteService);

// Initialize repositories
const mainSettingRepository = new MainSettingRepository(sqliteService);
const productRepository = new ProductRepository(sqliteService);
const locationRepository = new LocationRepository(sqliteService);
const staffRepository = new StaffRepository(sqliteService);
const supplierRepository = new SupplierRepository(sqliteService);
const inventoryDataRepository = new InventoryDataRepository(sqliteService);
const stockinDataRepository = new StockinDataRepository(sqliteService);
const stockoutDataRepository = new StockoutDataRepository(sqliteService);

// Initialize services
const settingService = new SettingService(mainSettingRepository);
const dataImportService = new DataImportService(
  productRepository,
  locationRepository,
  staffRepository,
  supplierRepository
);

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
  // Initialize the database with all schemas
  try {
    await mainSettingRepository.initializeDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// IPC Handlers for File System operations
ipcMain.handle('fs:writeTemporaryFile', async (_, fileName: string, arrayBuffer: ArrayBuffer) => {
  try {
    const tempDir = os.tmpdir();
    const sanitizedFileName = path.basename(fileName); // Security: prevent path traversal
    const tempPath = path.join(tempDir, `electron_transfer_${Date.now()}_${Math.random().toString(36).substring(7)}_${sanitizedFileName}`);
    
    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.writeFile(tempPath, buffer);
    
    console.log(`Temporary file created: ${tempPath}`);
    return tempPath;
  } catch (error) {
    console.error('Error writing temporary file:', error);
    throw error;
  }
});

ipcMain.handle('fs:cleanupTemporaryFile', async (_, filePath: string) => {
  try {
    // Security check: only allow cleanup of files in temp directory
    const tempDir = os.tmpdir();
    const normalizedPath = path.normalize(filePath);
    const normalizedTempDir = path.normalize(tempDir);
    
    if (!normalizedPath.startsWith(normalizedTempDir)) {
      console.error('Security violation: Attempt to delete file outside temp directory');
      return false;
    }

    await fs.promises.unlink(filePath);
    console.log(`Temporary file cleaned up: ${filePath}`);
    return true;
  } catch (error) {
    console.error('Error cleaning up temporary file:', error);
    return false;
  }
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

// IPC Handlers for Data Import operations
ipcMain.handle('import:parseFile', async (_, filePath: string) => {
  try {
    console.log(`Parsing file: ${filePath}`);
    return await fileParserService.parseFile(filePath);
  } catch (error) {
    console.error('Error parsing file:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    };
  }
});

ipcMain.handle('import:importData', async (_, csvData: any[], fileType: string) => {
  try {
    console.log(`Importing ${csvData.length} records of type: ${fileType}`);
    return await dataImportService.importData(csvData, fileType as any);
  } catch (error) {
    console.error('Error importing data:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown import error',
      recordsProcessed: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
});

ipcMain.handle('import:detectFileType', async (_, headers: string[]) => {
  try {
    return dataImportService.detectFileType(headers);
  } catch (error) {
    console.error('Error detecting file type:', error);
    return null;
  }
});

// IPC Handlers for Data Synchronization operations
ipcMain.handle('dataSync:syncFromDevice', async (event, deviceId: string, remoteDatabasePath: string) => {
  try {
    console.log(`Starting data synchronization from device: ${deviceId}, database: ${remoteDatabasePath}`);
    
    const results = await dataSyncService.syncDataFromDevice(
      deviceId, 
      remoteDatabasePath,
      (progress) => {
        // Send progress updates to renderer process
        event.sender.send('dataSync:progress', progress);
      }
    );
    
    console.log('Data synchronization completed:', results);
    return results;
  } catch (error) {
    console.error('Error synchronizing data from device:', error);
    throw error;
  }
});

// IPC Handlers for Data Query operations
ipcMain.handle('data:getAllProducts', async () => {
  try {
    return await productRepository.getAllProducts();
  } catch (error) {
    console.error('Error getting all products:', error);
    return [];
  }
});

ipcMain.handle('data:getAllLocations', async () => {
  try {
    return await locationRepository.getAllLocations();
  } catch (error) {
    console.error('Error getting all locations:', error);
    return [];
  }
});

ipcMain.handle('data:getAllStaff', async () => {
  try {
    return await staffRepository.getAllStaff();
  } catch (error) {
    console.error('Error getting all staff:', error);
    return [];
  }
});

ipcMain.handle('data:getAllSuppliers', async () => {
  try {
    return await supplierRepository.getAllSuppliers();
  } catch (error) {
    console.error('Error getting all suppliers:', error);
    return [];
  }
});

// IPC Handlers for Data Statistics operations
ipcMain.handle('data:getInventoryDataCount', async () => {
  try {
    const result = await sqliteService.get<{ count: number }>('SELECT COUNT(*) as count FROM inventory_data');
    return result?.count || 0;
  } catch (error) {
    console.error('Error getting inventory data count:', error);
    return 0;
  }
});

ipcMain.handle('data:getStockinDataCount', async () => {
  try {
    const result = await sqliteService.get<{ count: number }>('SELECT COUNT(*) as count FROM stockin_data');
    return result?.count || 0;
  } catch (error) {
    console.error('Error getting stockin data count:', error);
    return 0;
  }
});

ipcMain.handle('data:getStockoutDataCount', async () => {
  try {
    const result = await sqliteService.get<{ count: number }>('SELECT COUNT(*) as count FROM stockout_data');
    return result?.count || 0;
  } catch (error) {
    console.error('Error getting stockout data count:', error);
    return 0;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});