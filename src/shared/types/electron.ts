// src/shared/types/electron.ts - Updated with date filtering service layer architecture
import { AndroidDevice } from '@/domain/entities/AndroidDevice';
import { DeviceFile } from '@/domain/entities/DeviceFile';
import { FileTransferResult } from '@/domain/entities/FileTransferResult';
import { Setting } from '@/domain/entities/Setting';
import { SettingKey } from '@/shared/constants/settings';
import { Product } from '@/domain/entities/Product';
import { Location } from '@/domain/entities/Location';
import { Staff } from '@/domain/entities/Staff';
import { Supplier } from '@/domain/entities/Supplier';
import { InventoryData } from '@/domain/entities/InventoryData';
import { StockinData } from '@/domain/entities/StockinData';
import { StockoutData } from '@/domain/entities/StockoutData';
import { ImportResult } from '@/domain/entities/ImportResult';
import { FileParseResult, ImportFileType } from '@/application/services/DataImportService';
import { DataCounts, AllData, FilteredDataCounts, FilteredTransactionData } from '@/application/services/DataService';

export interface SyncResult {
    tableName: string;
    recordsFound: number;
    recordsInserted: number;
    recordsUpdated: number;
    success: boolean;
    error?: string;
}

export interface SyncProgress {
    currentTable: string;
    tablesCompleted: number;
    totalTables: number;
    currentRecords: number;
    totalRecords: number;
    overallProgress: number;
}

export interface ElectronAPI {
    getVersions(): {
        node: string;
        chrome: string;
        electron: string;
    };
    getPlatform(): string;

    // File System operations for temporary file management
    fs: {
        writeTemporaryFile(fileName: string, arrayBuffer: ArrayBuffer): Promise<string>;
        cleanupTemporaryFile(filePath: string): Promise<boolean>;
    };

    // Android Debug Bridge operations
    adb: {
        isAvailable(): Promise<boolean>;
        listDevices(): Promise<AndroidDevice[]>;
        getDeviceInfo(deviceId: string): Promise<AndroidDevice | null>;
        authorizeDevice(deviceId: string): Promise<boolean>;
        listFiles(deviceId: string, path: string): Promise<DeviceFile[]>;
        pullFile(
            deviceId: string,
            remotePath: string,
            localPath: string,
        ): Promise<FileTransferResult>;
        pushFile(
            deviceId: string,
            localPath: string,
            remotePath: string,
        ): Promise<FileTransferResult>;
        createDirectory(deviceId: string, path: string): Promise<boolean>;
        deleteFile(deviceId: string, path: string): Promise<boolean>;
    };

    // Settings management operations
    settings: {
        initialize(): Promise<boolean>;
        getSetting(key: SettingKey): Promise<Setting | null>;
        updateSetting(key: SettingKey, value: string): Promise<Setting>;
        getAllSettings(): Promise<Setting[]>;
        deleteSetting(key: SettingKey): Promise<boolean>;
    };

    // Data Import operations
    import: {
        parseFile(filePath: string): Promise<FileParseResult>;
        importData(csvData: any[], fileType: ImportFileType): Promise<ImportResult>;
        detectFileType(headers: string[]): Promise<ImportFileType | null>;
    };

    // Data Synchronization operations
    dataSync: {
        syncFromDevice(
            deviceId: string,
            remoteDatabasePath: string,
            progressCallback?: (progress: SyncProgress) => void,
        ): Promise<SyncResult[]>;
    };

    // Data Query operations - Updated to include date filtering capabilities
    data: {
        // Individual entity access
        getAllProducts(): Promise<Product[]>;
        getAllLocations(): Promise<Location[]>;
        getAllStaff(): Promise<Staff[]>;
        getAllSuppliers(): Promise<Supplier[]>;
        
        // Individual count access
        getInventoryDataCount(): Promise<number>;
        getStockinDataCount(): Promise<number>;
        getStockoutDataCount(): Promise<number>;
        
        // Aggregated service operations
        getDataCounts(): Promise<DataCounts>;
        getAllMasterData(): Promise<AllData>;

        // Date-filtered data operations (NEW)
        getInventoryDataByDateRange(fromDate: string, toDate: string): Promise<InventoryData[]>;
        getStockinDataByDateRange(fromDate: string, toDate: string): Promise<StockinData[]>;
        getStockoutDataByDateRange(fromDate: string, toDate: string): Promise<StockoutData[]>;
        getDataCountsByDateRange(fromDate: string, toDate: string): Promise<FilteredDataCounts>;
        getTransactionDataByDateRange(fromDate: string, toDate: string): Promise<FilteredTransactionData>;
    };
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}