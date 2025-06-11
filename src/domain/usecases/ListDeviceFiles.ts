// src/domain/usecases/ListDeviceFiles.ts
import { DeviceFile } from '../entities/DeviceFile';
import { IAndroidDeviceRepository } from '../repositories/IAndroidDeviceRepository';

export class ListDeviceFilesUseCase {
    constructor(private androidDeviceRepository: IAndroidDeviceRepository) {}

    async execute(deviceId: string, path: string = '/sdcard'): Promise<DeviceFile[]> {
        const device = await this.androidDeviceRepository.getDeviceInfo(deviceId);

        if (!device) {
            throw new Error(`Device with ID ${deviceId} not found.`);
        }

        if (!device.isAuthorized) {
            throw new Error('Device is not authorized. Please authorize the device first.');
        }

        return await this.androidDeviceRepository.listFiles(deviceId, path);
    }
}
