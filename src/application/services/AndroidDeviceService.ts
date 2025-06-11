// src/application/services/AndroidDeviceService.ts
import { GetConnectedDevicesUseCase } from '@/domain/usecases/GetConnectedDevices';
import { ConnectToDeviceUseCase } from '@/domain/usecases/ConnectToDevice';
import { ListDeviceFilesUseCase } from '@/domain/usecases/ListDeviceFiles';
import { TransferFileUseCase } from '@/domain/usecases/TransferFile';
import { IAndroidDeviceRepository } from '@/domain/repositories/IAndroidDeviceRepository';
import { AndroidDevice } from '@/domain/entities/AndroidDevice';
import { DeviceFile } from '@/domain/entities/DeviceFile';
import { FileTransferResult } from '@/domain/entities/FileTransferResult';

export class AndroidDeviceService {
    private getConnectedDevicesUseCase: GetConnectedDevicesUseCase;
    private connectToDeviceUseCase: ConnectToDeviceUseCase;
    private listDeviceFilesUseCase: ListDeviceFilesUseCase;
    private transferFileUseCase: TransferFileUseCase;

    constructor(androidDeviceRepository: IAndroidDeviceRepository) {
        this.getConnectedDevicesUseCase = new GetConnectedDevicesUseCase(androidDeviceRepository);
        this.connectToDeviceUseCase = new ConnectToDeviceUseCase(androidDeviceRepository);
        this.listDeviceFilesUseCase = new ListDeviceFilesUseCase(androidDeviceRepository);
        this.transferFileUseCase = new TransferFileUseCase(androidDeviceRepository);
    }

    async getConnectedDevices(): Promise<AndroidDevice[]> {
        return await this.getConnectedDevicesUseCase.execute();
    }

    async connectToDevice(deviceId: string): Promise<AndroidDevice | null> {
        return await this.connectToDeviceUseCase.execute(deviceId);
    }

    async listDeviceFiles(deviceId: string, path?: string): Promise<DeviceFile[]> {
        return await this.listDeviceFilesUseCase.execute(deviceId, path);
    }

    async downloadFile(
        deviceId: string,
        remotePath: string,
        localPath: string,
    ): Promise<FileTransferResult> {
        return await this.transferFileUseCase.downloadFile(deviceId, remotePath, localPath);
    }

    async uploadFile(
        deviceId: string,
        localPath: string,
        remotePath: string,
    ): Promise<FileTransferResult> {
        return await this.transferFileUseCase.uploadFile(deviceId, localPath, remotePath);
    }
}
