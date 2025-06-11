// src/infrastructure/repositories/AndroidDeviceRepository.ts
import { AndroidDevice } from '@/domain/entities/AndroidDevice';
import { DeviceFile } from '@/domain/entities/DeviceFile';
import { FileTransferResult } from '@/domain/entities/FileTransferResult';
import { IAndroidDeviceRepository } from '@/domain/repositories/IAndroidDeviceRepository';

export class AndroidDeviceRepository implements IAndroidDeviceRepository {
    private get electronAPI() {
        if (!window.electronAPI?.adb) {
            throw new Error(
                'Electron ADB API is not available. Please ensure the application is running in Electron environment.',
            );
        }
        return window.electronAPI.adb;
    }

    async getConnectedDevices(): Promise<AndroidDevice[]> {
        return await this.electronAPI.listDevices();
    }

    async getDeviceInfo(deviceId: string): Promise<AndroidDevice | null> {
        return await this.electronAPI.getDeviceInfo(deviceId);
    }

    async isAdbAvailable(): Promise<boolean> {
        return await this.electronAPI.isAvailable();
    }

    async authorizeDevice(deviceId: string): Promise<boolean> {
        return await this.electronAPI.authorizeDevice(deviceId);
    }

    async listFiles(deviceId: string, path: string): Promise<DeviceFile[]> {
        return await this.electronAPI.listFiles(deviceId, path);
    }

    async readFile(
        deviceId: string,
        remotePath: string,
        localPath: string,
    ): Promise<FileTransferResult> {
        return await this.electronAPI.pullFile(deviceId, remotePath, localPath);
    }

    async writeFile(
        deviceId: string,
        localPath: string,
        remotePath: string,
    ): Promise<FileTransferResult> {
        return await this.electronAPI.pushFile(deviceId, localPath, remotePath);
    }

    async createDirectory(deviceId: string, path: string): Promise<boolean> {
        return await this.electronAPI.createDirectory(deviceId, path);
    }

    async deleteFile(deviceId: string, path: string): Promise<boolean> {
        return await this.electronAPI.deleteFile(deviceId, path);
    }
}
