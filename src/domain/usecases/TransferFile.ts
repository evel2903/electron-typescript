// src/domain/usecases/TransferFile.ts
import { FileTransferResult } from '../entities/FileTransferResult';
import { IAndroidDeviceRepository } from '../repositories/IAndroidDeviceRepository';

export class TransferFileUseCase {
  constructor(private androidDeviceRepository: IAndroidDeviceRepository) {}

  async downloadFile(deviceId: string, remotePath: string, localPath: string): Promise<FileTransferResult> {
    const device = await this.androidDeviceRepository.getDeviceInfo(deviceId);
    
    if (!device || !device.isAuthorized) {
      return {
        success: false,
        message: 'Device not found or not authorized',
        error: 'DEVICE_NOT_AUTHORIZED'
      };
    }

    return await this.androidDeviceRepository.readFile(deviceId, remotePath, localPath);
  }

  async uploadFile(deviceId: string, localPath: string, remotePath: string): Promise<FileTransferResult> {
    const device = await this.androidDeviceRepository.getDeviceInfo(deviceId);
    
    if (!device || !device.isAuthorized) {
      return {
        success: false,
        message: 'Device not found or not authorized',
        error: 'DEVICE_NOT_AUTHORIZED'
      };
    }

    return await this.androidDeviceRepository.writeFile(deviceId, localPath, remotePath);
  }
}