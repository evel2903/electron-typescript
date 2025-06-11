// src/domain/repositories/IAndroidDeviceRepository.ts
import { AndroidDevice } from '../entities/AndroidDevice';
import { DeviceFile } from '../entities/DeviceFile';
import { FileTransferResult } from '../entities/FileTransferResult';

export interface IAndroidDeviceRepository {
    getConnectedDevices(): Promise<AndroidDevice[]>;
    getDeviceInfo(deviceId: string): Promise<AndroidDevice | null>;
    isAdbAvailable(): Promise<boolean>;
    authorizeDevice(deviceId: string): Promise<boolean>;
    listFiles(deviceId: string, path: string): Promise<DeviceFile[]>;
    readFile(deviceId: string, remotePath: string, localPath: string): Promise<FileTransferResult>;
    writeFile(deviceId: string, localPath: string, remotePath: string): Promise<FileTransferResult>;
    createDirectory(deviceId: string, path: string): Promise<boolean>;
    deleteFile(deviceId: string, path: string): Promise<boolean>;
}
