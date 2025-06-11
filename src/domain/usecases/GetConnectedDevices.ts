// src/domain/usecases/GetConnectedDevices.ts
import { AndroidDevice } from '../entities/AndroidDevice';
import { IAndroidDeviceRepository } from '../repositories/IAndroidDeviceRepository';

export class GetConnectedDevicesUseCase {
    constructor(private androidDeviceRepository: IAndroidDeviceRepository) {}

    async execute(): Promise<AndroidDevice[]> {
        const isAdbAvailable = await this.androidDeviceRepository.isAdbAvailable();

        if (!isAdbAvailable) {
            throw new Error(
                'ADB is not available. Please ensure Android Debug Bridge is installed and configured.',
            );
        }

        return await this.androidDeviceRepository.getConnectedDevices();
    }
}
