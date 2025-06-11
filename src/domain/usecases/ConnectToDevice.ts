// src/domain/usecases/ConnectToDevice.ts
import { AndroidDevice } from '../entities/AndroidDevice';
import { IAndroidDeviceRepository } from '../repositories/IAndroidDeviceRepository';

export class ConnectToDeviceUseCase {
    constructor(private androidDeviceRepository: IAndroidDeviceRepository) {}

    async execute(deviceId: string): Promise<AndroidDevice | null> {
        const device = await this.androidDeviceRepository.getDeviceInfo(deviceId);

        if (!device) {
            throw new Error(`Device with ID ${deviceId} not found.`);
        }

        if (!device.isAuthorized) {
            const authorized = await this.androidDeviceRepository.authorizeDevice(deviceId);
            if (!authorized) {
                throw new Error(
                    'Failed to authorize device. Please check USB debugging permissions on your Android device.',
                );
            }
        }

        return await this.androidDeviceRepository.getDeviceInfo(deviceId);
    }
}
