import { DataCounts, AllData } from '@/application/services/DataService';
import { AndroidDevice } from '@/domain/entities/AndroidDevice';
import { DeviceFile } from '@/domain/entities/DeviceFile';
import { FileTransferResult } from '@/domain/entities/FileTransferResult';
import { Setting } from '@/domain/entities/Setting';
import { Staff } from '@/domain/entities/Staff';
import { Supplier } from '@/domain/entities/Supplier';
import { Product } from 'electron';
import { SettingKey } from '../constants/settings';

// src/shared/types/services.ts - New file for service layer types
export interface IDataService {
    getDataCounts(): Promise<DataCounts>;
    getAllMasterData(): Promise<AllData>;
    getProducts(): Promise<Product[]>;
    getLocations(): Promise<Location[]>;
    getStaff(): Promise<Staff[]>;
    getSuppliers(): Promise<Supplier[]>;
    getInventoryDataCount(): Promise<number>;
    getStockinDataCount(): Promise<number>;
    getStockoutDataCount(): Promise<number>;
}

export interface IMainProcessServices {
    dataService: IDataService;
    settingService: {
        getSetting(key: SettingKey): Promise<Setting | null>;
        updateSetting(key: SettingKey, value: string): Promise<Setting>;
        getAllSettings(): Promise<Setting[]>;
    };
    androidDeviceService: {
        getConnectedDevices(): Promise<AndroidDevice[]>;
        connectToDevice(deviceId: string): Promise<AndroidDevice | null>;
        listDeviceFiles(deviceId: string, path?: string): Promise<DeviceFile[]>;
        downloadFile(
            deviceId: string,
            remotePath: string,
            localPath: string,
        ): Promise<FileTransferResult>;
        uploadFile(
            deviceId: string,
            localPath: string,
            remotePath: string,
        ): Promise<FileTransferResult>;
    };
}
