// src/shared/types/electron.ts
import { AndroidDevice } from '@/domain/entities/AndroidDevice';
import { DeviceFile } from '@/domain/entities/DeviceFile';
import { FileTransferResult } from '@/domain/entities/FileTransferResult';

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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}