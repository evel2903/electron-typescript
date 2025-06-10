// src/shared/types/electron.ts - Updated with database types
import { AndroidDevice } from '@/domain/entities/AndroidDevice';
import { DeviceFile } from '@/domain/entities/DeviceFile';
import { FileTransferResult } from '@/domain/entities/FileTransferResult';
import { Setting } from '@/domain/entities/Setting';

export interface ElectronAPI {
  getVersions(): {
    node: string;
    chrome: string;
    electron: string;
  };
  getPlatform(): string;
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
  database: {
    initializeDatabase(): Promise<void>;
    getAllSettings(): Promise<Setting[]>;
    getSettingByKey(key: string): Promise<Setting | null>;
    createSetting(key: string, value: string): Promise<Setting>;
    updateSetting(key: string, value: string): Promise<Setting>;
    upsertSetting(key: string, value: string): Promise<Setting>;
    deleteSetting(key: string): Promise<boolean>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}