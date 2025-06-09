// src/infrastructure/repositories/AndroidDeviceRepository.ts
import { AndroidDevice } from '@/domain/entities/AndroidDevice';
import { DeviceFile } from '@/domain/entities/DeviceFile';
import { FileTransferResult } from '@/domain/entities/FileTransferResult';
import { IAndroidDeviceRepository } from '@/domain/repositories/IAndroidDeviceRepository';
import { AdbService } from '../services/AdbService';

export class AndroidDeviceRepository implements IAndroidDeviceRepository {
  constructor(private adbService: AdbService) {}

  async getConnectedDevices(): Promise<AndroidDevice[]> {
    return await this.adbService.listDevices();
  }

  async getDeviceInfo(deviceId: string): Promise<AndroidDevice | null> {
    return await this.adbService.getDeviceInfo(deviceId);
  }

  async isAdbAvailable(): Promise<boolean> {
    return await this.adbService.isAdbAvailable();
  }

  async authorizeDevice(deviceId: string): Promise<boolean> {
    return await this.adbService.authorizeDevice(deviceId);
  }

  async listFiles(deviceId: string, path: string): Promise<DeviceFile[]> {
    return await this.adbService.listFiles(deviceId, path);
  }

  async readFile(deviceId: string, remotePath: string, localPath: string): Promise<FileTransferResult> {
    return await this.adbService.pullFile(deviceId, remotePath, localPath);
  }

  async writeFile(deviceId: string, localPath: string, remotePath: string): Promise<FileTransferResult> {
    return await this.adbService.pushFile(deviceId, localPath, remotePath);
  }

  async createDirectory(deviceId: string, path: string): Promise<boolean> {
    return await this.adbService.createDirectory(deviceId, path);
  }

  async deleteFile(deviceId: string, path: string): Promise<boolean> {
    return await this.adbService.deleteFile(deviceId, path);
  }
}