// src/shared/types/electron.ts - Updated with data import types
import { AndroidDevice } from '@/domain/entities/AndroidDevice';
import { DeviceFile } from '@/domain/entities/DeviceFile';
import { FileTransferResult } from '@/domain/entities/FileTransferResult';
import { Setting } from '@/domain/entities/Setting';
import { SettingKey } from '@/shared/constants/settings';
import { Product } from '@/domain/entities/Product';
import { Location } from '@/domain/entities/Location';
import { Staff } from '@/domain/entities/Staff';
import { Supplier } from '@/domain/entities/Supplier';
import { ImportResult } from '@/domain/entities/ImportResult';
import { FileParseResult, ImportFileType } from '@/application/services/DataImportService';

export interface ElectronAPI {
  getVersions(): {
    node: string;
    chrome: string;
    electron: string;
  };
  getPlatform(): string;
  
  // File System operations for temporary file management
  fs: {
    writeTemporaryFile(fileName: string, arrayBuffer: ArrayBuffer): Promise<string>;
    cleanupTemporaryFile(filePath: string): Promise<boolean>;
  };
  
  adb: {
    isAvailable(): Promise<boolean>;
    listDevices(): Promise<AndroidDevice[]>;
    getDeviceInfo(deviceId: string): Promise<AndroidDevice | null>;
    authorizeDevice(deviceId: string): Promise<boolean>;
    listFiles(deviceId: string, path: string): Promise<DeviceFile[]>;
    pullFile(deviceId: string, remotePath: string, localPath: string): Promise<FileTransferResult>;
    pushFile(deviceId: string, localPath: string, remotePath: string): Promise<FileTransferResult>;
    createDirectory(deviceId: string, path: string): Promise<boolean>;
    deleteFile(deviceId: string, path: string): Promise<boolean>;
  };

  settings: {
    initialize(): Promise<boolean>;
    getSetting(key: SettingKey): Promise<Setting | null>;
    updateSetting(key: SettingKey, value: string): Promise<Setting>;
    getAllSettings(): Promise<Setting[]>;
    deleteSetting(key: SettingKey): Promise<boolean>;
  };

  // Data Import APIs
  import: {
    parseFile(filePath: string): Promise<FileParseResult>;
    importData(csvData: any[], fileType: ImportFileType): Promise<ImportResult>;
    detectFileType(headers: string[]): Promise<ImportFileType | null>;
  };

  // Data Query APIs
  data: {
    getAllProducts(): Promise<Product[]>;
    getAllLocations(): Promise<Location[]>;
    getAllStaff(): Promise<Staff[]>;
    getAllSuppliers(): Promise<Supplier[]>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}