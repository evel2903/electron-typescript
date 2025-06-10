// src/shared/types/electron.ts
import { AndroidDevice } from '@/domain/entities/AndroidDevice';
import { DeviceFile } from '@/domain/entities/DeviceFile';
import { FileTransferResult } from '@/domain/entities/FileTransferResult';
import { Setting } from '@/domain/entities/Setting';
import { SettingKey } from '@/shared/constants/settings';

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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}