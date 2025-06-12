// src/application/services/DIContainer.ts - Complete Renderer Process DI Container with Date Filtering
import { AppService } from './AppService';
import { AndroidDeviceService } from './AndroidDeviceService';
import { SettingService } from './SettingService';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { AppInfoRepository } from '@/infrastructure/repositories/AppInfoRepository';
import { AndroidDeviceRepository } from '@/infrastructure/repositories/AndroidDeviceRepository';
import { SettingRepository } from '@/infrastructure/repositories/SettingRepository';
import { IElectronAPI } from '../interfaces/IElectronAPI';
import { InventoryData } from '@/domain/entities/InventoryData';
import { StockinData } from '@/domain/entities/StockinData';
import { StockoutData } from '@/domain/entities/StockoutData';
import { Product } from '@/domain/entities/Product';
import { Location } from '@/domain/entities/Location';
import { Staff } from '@/domain/entities/Staff';
import { Supplier } from '@/domain/entities/Supplier';

/**
 * Dependency Injection Container for the Renderer Process
 * This container provides services that are appropriate for the renderer process.
 * Data operations should use window.electronAPI.data.* instead of direct repository access.
 */
export class DIContainer {
    private static instance: DIContainer;
    private appService: AppService | null = null;
    private androidDeviceService: AndroidDeviceService | null = null;
    private settingService: SettingService | null = null;

    private constructor() {}

    static getInstance(): DIContainer {
        if (!DIContainer.instance) {
            DIContainer.instance = new DIContainer();
        }
        return DIContainer.instance;
    }

    /**
     * Get App Service for general application information
     * Uses IPC-based repositories for renderer process
     */
    getAppService(electronAPI?: IElectronAPI): AppService {
        if (!this.appService) {
            const userRepository = new UserRepository();
            const appInfoRepository = new AppInfoRepository(electronAPI);
            this.appService = new AppService(userRepository, appInfoRepository);
        }
        return this.appService;
    }

    /**
     * Get Android Device Service for device operations
     * Uses IPC-based repository for renderer process
     */
    getAndroidDeviceService(): AndroidDeviceService {
        if (!this.androidDeviceService) {
            // AndroidDeviceRepository uses IPC to communicate with main process
            const androidDeviceRepository = new AndroidDeviceRepository();
            this.androidDeviceService = new AndroidDeviceService(androidDeviceRepository);
        }
        return this.androidDeviceService;
    }

    /**
     * Get Setting Service for application settings
     * Uses IPC-based repository for renderer process
     */
    getSettingService(): SettingService {
        if (!this.settingService) {
            // SettingRepository uses IPC to communicate with main process
            const settingRepository = new SettingRepository();
            this.settingService = new SettingService(settingRepository);
        }
        return this.settingService;
    }

    /**
     * Reset all services (useful for testing or cleanup)
     */
    reset(): void {
        this.appService = null;
        this.androidDeviceService = null;
        this.settingService = null;
    }
}

/**
 * Interface definitions for type safety
 */
export interface DataCounts {
    inventory: number;
    stockin: number;
    stockout: number;
    products: number;
    locations: number;
    staff: number;
    suppliers: number;
}

export interface FilteredDataCounts {
    inventory: number;
    stockin: number;
    stockout: number;
}

export interface AllMasterData {
    products: Product[];
    locations: Location[];
    staff: Staff[];
    suppliers: Supplier[];
}

export interface FilteredTransactionData {
    inventoryData: InventoryData[];
    stockinData: StockinData[];
    stockoutData: StockoutData[];
}

/**
 * Data Service Helper for Renderer Process
 * This class provides a clean interface to the main process data service
 * through IPC communication, including comprehensive date filtering capabilities.
 */
export class RendererDataService {
    private static instance: RendererDataService;

    private constructor() {}

    static getInstance(): RendererDataService {
        if (!RendererDataService.instance) {
            RendererDataService.instance = new RendererDataService();
        }
        return RendererDataService.instance;
    }

    /**
     * Get all data counts from the main process data service
     * Returns overall counts for all data types in the system
     */
    async getDataCounts(): Promise<DataCounts> {
        try {
            return await window.electronAPI.data.getDataCounts();
        } catch (error) {
            console.error('Error getting data counts from main process:', error);
            return {
                inventory: 0,
                stockin: 0,
                stockout: 0,
                products: 0,
                locations: 0,
                staff: 0,
                suppliers: 0,
            };
        }
    }

    /**
     * Get filtered data counts by date range from the main process data service
     * Filters transaction data (inventory, stockin, stockout) by the specified date range
     * @param fromDate Start date in YYYY/MM/DD format (e.g., '2025/04/29')
     * @param toDate End date in YYYY/MM/DD format (e.g., '2025/05/15')
     * @returns Promise containing filtered counts for transaction data types
     */
    async getDataCountsByDateRange(fromDate: string, toDate: string): Promise<FilteredDataCounts> {
        try {
            return await window.electronAPI.data.getDataCountsByDateRange(fromDate, toDate);
        } catch (error) {
            console.error('Error getting filtered data counts from main process:', error);
            return {
                inventory: 0,
                stockin: 0,
                stockout: 0,
            };
        }
    }

    /**
     * Get all transaction data by date range from the main process data service
     * Retrieves complete transaction records for all data types within the specified date range
     * @param fromDate Start date in YYYY/MM/DD format (e.g., '2025/04/29')
     * @param toDate End date in YYYY/MM/DD format (e.g., '2025/05/15')
     * @returns Promise containing arrays of filtered transaction records
     */
    async getTransactionDataByDateRange(fromDate: string, toDate: string): Promise<FilteredTransactionData> {
        try {
            return await window.electronAPI.data.getTransactionDataByDateRange(fromDate, toDate);
        } catch (error) {
            console.error('Error getting transaction data by date range from main process:', error);
            return {
                inventoryData: [],
                stockinData: [],
                stockoutData: [],
            };
        }
    }

    /**
     * Get inventory data filtered by date range from the main process data service
     * Retrieves inventory records within the specified date range based on input_date field
     * @param fromDate Start date in YYYY/MM/DD format (e.g., '2025/04/29')
     * @param toDate End date in YYYY/MM/DD format (e.g., '2025/05/15')
     * @returns Promise containing array of filtered inventory records
     */
    async getInventoryDataByDateRange(fromDate: string, toDate: string): Promise<InventoryData[]> {
        try {
            return await window.electronAPI.data.getInventoryDataByDateRange(fromDate, toDate);
        } catch (error) {
            console.error('Error getting inventory data by date range from main process:', error);
            return [];
        }
    }

    /**
     * Get stock-in data filtered by date range from the main process data service
     * Retrieves stock-in records within the specified date range based on input_date field
     * @param fromDate Start date in YYYY/MM/DD format (e.g., '2025/04/29')
     * @param toDate End date in YYYY/MM/DD format (e.g., '2025/05/15')
     * @returns Promise containing array of filtered stock-in records
     */
    async getStockinDataByDateRange(fromDate: string, toDate: string): Promise<StockinData[]> {
        try {
            return await window.electronAPI.data.getStockinDataByDateRange(fromDate, toDate);
        } catch (error) {
            console.error('Error getting stockin data by date range from main process:', error);
            return [];
        }
    }

    /**
     * Get stock-out data filtered by date range from the main process data service
     * Retrieves stock-out records within the specified date range based on input_date field
     * @param fromDate Start date in YYYY/MM/DD format (e.g., '2025/04/29')
     * @param toDate End date in YYYY/MM/DD format (e.g., '2025/05/15')
     * @returns Promise containing array of filtered stock-out records
     */
    async getStockoutDataByDateRange(fromDate: string, toDate: string): Promise<StockoutData[]> {
        try {
            return await window.electronAPI.data.getStockoutDataByDateRange(fromDate, toDate);
        } catch (error) {
            console.error('Error getting stockout data by date range from main process:', error);
            return [];
        }
    }

    /**
     * Get all master data from the main process data service
     * Retrieves complete sets of master data including products, locations, staff, and suppliers
     * @returns Promise containing all master data entities
     */
    async getAllMasterData(): Promise<AllMasterData> {
        try {
            return await window.electronAPI.data.getAllMasterData();
        } catch (error) {
            console.error('Error getting master data from main process:', error);
            return {
                products: [],
                locations: [],
                staff: [],
                suppliers: [],
            };
        }
    }

    /**
     * Get products from the main process data service
     * Retrieves all product records from the database
     * @returns Promise containing array of product records
     */
    async getProducts(): Promise<Product[]> {
        try {
            return await window.electronAPI.data.getAllProducts();
        } catch (error) {
            console.error('Error getting products from main process:', error);
            return [];
        }
    }

    /**
     * Get locations from the main process data service
     * Retrieves all location records from the database
     * @returns Promise containing array of location records
     */
    async getLocations(): Promise<Location[]> {
        try {
            return await window.electronAPI.data.getAllLocations();
        } catch (error) {
            console.error('Error getting locations from main process:', error);
            return [];
        }
    }

    /**
     * Get staff from the main process data service
     * Retrieves all staff records from the database
     * @returns Promise containing array of staff records
     */
    async getStaff(): Promise<Staff[]> {
        try {
            return await window.electronAPI.data.getAllStaff();
        } catch (error) {
            console.error('Error getting staff from main process:', error);
            return [];
        }
    }

    /**
     * Get suppliers from the main process data service
     * Retrieves all supplier records from the database
     * @returns Promise containing array of supplier records
     */
    async getSuppliers(): Promise<Supplier[]> {
        try {
            return await window.electronAPI.data.getAllSuppliers();
        } catch (error) {
            console.error('Error getting suppliers from main process:', error);
            return [];
        }
    }

    /**
     * Get inventory data count from the main process data service
     * Returns the total number of inventory records in the database
     * @returns Promise containing the count of inventory records
     */
    async getInventoryDataCount(): Promise<number> {
        try {
            return await window.electronAPI.data.getInventoryDataCount();
        } catch (error) {
            console.error('Error getting inventory data count from main process:', error);
            return 0;
        }
    }

    /**
     * Get stockin data count from the main process data service
     * Returns the total number of stock-in records in the database
     * @returns Promise containing the count of stock-in records
     */
    async getStockinDataCount(): Promise<number> {
        try {
            return await window.electronAPI.data.getStockinDataCount();
        } catch (error) {
            console.error('Error getting stockin data count from main process:', error);
            return 0;
        }
    }

    /**
     * Get stockout data count from the main process data service
     * Returns the total number of stock-out records in the database
     * @returns Promise containing the count of stock-out records
     */
    async getStockoutDataCount(): Promise<number> {
        try {
            return await window.electronAPI.data.getStockoutDataCount();
        } catch (error) {
            console.error('Error getting stockout data count from main process:', error);
            return 0;
        }
    }

    /**
     * Utility method to validate date format for API calls
     * Ensures dates are in the correct YYYY/MM/DD format before making API requests
     * @param date Date string to validate
     * @returns Boolean indicating whether the date format is valid
     */
    validateDateFormat(date: string): boolean {
        const regex = /^\d{4}\/\d{1,2}\/\d{1,2}$/;
        if (!regex.test(date)) return false;

        const [year, month, day] = date.split('/').map(Number);
        const dateObj = new Date(year, month - 1, day);
        return (
            dateObj.getFullYear() === year &&
            dateObj.getMonth() === month - 1 &&
            dateObj.getDate() === day
        );
    }

    /**
     * Utility method to format dates consistently
     * Ensures consistent date formatting across the application
     * @param date Date object or string to format
     * @returns Formatted date string in YYYY/MM/DD format
     */
    formatDateForAPI(date: Date | string): string {
        if (typeof date === 'string') {
            return date;
        }
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}/${month}/${day}`;
    }

    /**
     * Utility method to get common date ranges
     * Provides pre-calculated date ranges for common filtering scenarios
     * @param period Predefined period ('week', 'month', 'quarter', 'year')
     * @returns Object containing fromDate and toDate in YYYY/MM/DD format
     */
    getCommonDateRange(period: 'week' | 'month' | 'quarter' | 'year'): { fromDate: string; toDate: string } {
        const today = new Date();
        const startDate = new Date(today);

        switch (period) {
            case 'week':
                startDate.setDate(today.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(today.getMonth() - 1);
                break;
            case 'quarter':
                startDate.setMonth(today.getMonth() - 3);
                break;
            case 'year':
                startDate.setFullYear(today.getFullYear() - 1);
                break;
        }

        return {
            fromDate: this.formatDateForAPI(startDate),
            toDate: this.formatDateForAPI(today),
        };
    }
}