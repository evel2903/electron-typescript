// src/application/services/DIContainer.ts - Final Renderer Process version (Presentation Layer)
import { AppService } from './AppService';
import { AndroidDeviceService } from './AndroidDeviceService';
import { SettingService } from './SettingService';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { AppInfoRepository } from '@/infrastructure/repositories/AppInfoRepository';
import { AndroidDeviceRepository } from '@/infrastructure/repositories/AndroidDeviceRepository';
import { SettingRepository } from '@/infrastructure/repositories/SettingRepository';
import { IElectronAPI } from '../interfaces/IElectronAPI';

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
 * Data Service Helper for Renderer Process
 * This class provides a clean interface to the main process data service
 * through IPC communication.
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
     */
    async getDataCounts() {
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
     * Get all master data from the main process data service
     */
    async getAllMasterData() {
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
     */
    async getProducts() {
        try {
            return await window.electronAPI.data.getAllProducts();
        } catch (error) {
            console.error('Error getting products from main process:', error);
            return [];
        }
    }

    /**
     * Get locations from the main process data service
     */
    async getLocations() {
        try {
            return await window.electronAPI.data.getAllLocations();
        } catch (error) {
            console.error('Error getting locations from main process:', error);
            return [];
        }
    }

    /**
     * Get staff from the main process data service
     */
    async getStaff() {
        try {
            return await window.electronAPI.data.getAllStaff();
        } catch (error) {
            console.error('Error getting staff from main process:', error);
            return [];
        }
    }

    /**
     * Get suppliers from the main process data service
     */
    async getSuppliers() {
        try {
            return await window.electronAPI.data.getAllSuppliers();
        } catch (error) {
            console.error('Error getting suppliers from main process:', error);
            return [];
        }
    }

    /**
     * Get inventory data count from the main process data service
     */
    async getInventoryDataCount() {
        try {
            return await window.electronAPI.data.getInventoryDataCount();
        } catch (error) {
            console.error('Error getting inventory data count from main process:', error);
            return 0;
        }
    }

    /**
     * Get stockin data count from the main process data service
     */
    async getStockinDataCount() {
        try {
            return await window.electronAPI.data.getStockinDataCount();
        } catch (error) {
            console.error('Error getting stockin data count from main process:', error);
            return 0;
        }
    }

    /**
     * Get stockout data count from the main process data service
     */
    async getStockoutDataCount() {
        try {
            return await window.electronAPI.data.getStockoutDataCount();
        } catch (error) {
            console.error('Error getting stockout data count from main process:', error);
            return 0;
        }
    }
}