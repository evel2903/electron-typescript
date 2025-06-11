// src/application/services/DIContainer.ts - Updated for service layer architecture
import { AppService } from './AppService';
import { AndroidDeviceService } from './AndroidDeviceService';
import { SettingService } from './SettingService';
import { DataService } from './DataService';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { AppInfoRepository } from '@/infrastructure/repositories/AppInfoRepository';
import { AndroidDeviceRepository } from '@/infrastructure/repositories/AndroidDeviceRepository';
import { SettingRepository } from '@/infrastructure/repositories/SettingRepository';
import { ProductRepository } from '@/infrastructure/repositories/ProductRepository';
import { LocationRepository } from '@/infrastructure/repositories/LocationRepository';
import { StaffRepository } from '@/infrastructure/repositories/StaffRepository';
import { SupplierRepository } from '@/infrastructure/repositories/SupplierRepository';
import { InventoryDataRepository } from '@/infrastructure/repositories/InventoryDataRepository';
import { StockinDataRepository } from '@/infrastructure/repositories/StockinDataRepository';
import { StockoutDataRepository } from '@/infrastructure/repositories/StockoutDataRepository';
import { SqliteService } from '@/infrastructure/services/SqliteService';
import { IElectronAPI } from '../interfaces/IElectronAPI';

export class DIContainer {
    private static instance: DIContainer;
    private appService: AppService | null = null;
    private androidDeviceService: AndroidDeviceService | null = null;
    private settingService: SettingService | null = null;
    private dataService: DataService | null = null;

    // Repository instances for the main process
    private sqliteService: SqliteService | null = null;
    private productRepository: ProductRepository | null = null;
    private locationRepository: LocationRepository | null = null;
    private staffRepository: StaffRepository | null = null;
    private supplierRepository: SupplierRepository | null = null;
    private inventoryDataRepository: InventoryDataRepository | null = null;
    private stockinDataRepository: StockinDataRepository | null = null;
    private stockoutDataRepository: StockoutDataRepository | null = null;

    private constructor() {}

    static getInstance(): DIContainer {
        if (!DIContainer.instance) {
            DIContainer.instance = new DIContainer();
        }
        return DIContainer.instance;
    }

    getAppService(electronAPI?: IElectronAPI): AppService {
        if (!this.appService) {
            const userRepository = new UserRepository();
            const appInfoRepository = new AppInfoRepository(electronAPI);
            this.appService = new AppService(userRepository, appInfoRepository);
        }
        return this.appService;
    }

    getAndroidDeviceService(): AndroidDeviceService {
        if (!this.androidDeviceService) {
            const androidDeviceRepository = new AndroidDeviceRepository();
            this.androidDeviceService = new AndroidDeviceService(androidDeviceRepository);
        }
        return this.androidDeviceService;
    }

    getSettingService(): SettingService {
        if (!this.settingService) {
            const settingRepository = new SettingRepository();
            this.settingService = new SettingService(settingRepository);
        }
        return this.settingService;
    }

    getDataService(): DataService {
        if (!this.dataService) {
            // Get or create SqliteService for main process
            if (!this.sqliteService) {
                this.sqliteService = new SqliteService();
            }

            // Create repository instances
            if (!this.inventoryDataRepository) {
                this.inventoryDataRepository = new InventoryDataRepository(this.sqliteService);
            }
            if (!this.stockinDataRepository) {
                this.stockinDataRepository = new StockinDataRepository(this.sqliteService);
            }
            if (!this.stockoutDataRepository) {
                this.stockoutDataRepository = new StockoutDataRepository(this.sqliteService);
            }
            if (!this.productRepository) {
                this.productRepository = new ProductRepository(this.sqliteService);
            }
            if (!this.locationRepository) {
                this.locationRepository = new LocationRepository(this.sqliteService);
            }
            if (!this.staffRepository) {
                this.staffRepository = new StaffRepository(this.sqliteService);
            }
            if (!this.supplierRepository) {
                this.supplierRepository = new SupplierRepository(this.sqliteService);
            }

            // Create DataService with all required repositories
            this.dataService = new DataService(
                this.inventoryDataRepository,
                this.stockinDataRepository,
                this.stockoutDataRepository,
                this.productRepository,
                this.locationRepository,
                this.staffRepository,
                this.supplierRepository,
            );
        }
        return this.dataService;
    }

    // Method to get individual repositories for main process services
    getProductRepository(): ProductRepository {
        if (!this.productRepository) {
            if (!this.sqliteService) {
                this.sqliteService = new SqliteService();
            }
            this.productRepository = new ProductRepository(this.sqliteService);
        }
        return this.productRepository;
    }

    getLocationRepository(): LocationRepository {
        if (!this.locationRepository) {
            if (!this.sqliteService) {
                this.sqliteService = new SqliteService();
            }
            this.locationRepository = new LocationRepository(this.sqliteService);
        }
        return this.locationRepository;
    }

    getStaffRepository(): StaffRepository {
        if (!this.staffRepository) {
            if (!this.sqliteService) {
                this.sqliteService = new SqliteService();
            }
            this.staffRepository = new StaffRepository(this.sqliteService);
        }
        return this.staffRepository;
    }

    getSupplierRepository(): SupplierRepository {
        if (!this.supplierRepository) {
            if (!this.sqliteService) {
                this.sqliteService = new SqliteService();
            }
            this.supplierRepository = new SupplierRepository(this.sqliteService);
        }
        return this.supplierRepository;
    }

    getInventoryDataRepository(): InventoryDataRepository {
        if (!this.inventoryDataRepository) {
            if (!this.sqliteService) {
                this.sqliteService = new SqliteService();
            }
            this.inventoryDataRepository = new InventoryDataRepository(this.sqliteService);
        }
        return this.inventoryDataRepository;
    }

    getStockinDataRepository(): StockinDataRepository {
        if (!this.stockinDataRepository) {
            if (!this.sqliteService) {
                this.sqliteService = new SqliteService();
            }
            this.stockinDataRepository = new StockinDataRepository(this.sqliteService);
        }
        return this.stockinDataRepository;
    }

    getStockoutDataRepository(): StockoutDataRepository {
        if (!this.stockoutDataRepository) {
            if (!this.sqliteService) {
                this.sqliteService = new SqliteService();
            }
            this.stockoutDataRepository = new StockoutDataRepository(this.sqliteService);
        }
        return this.stockoutDataRepository;
    }

    getSqliteService(): SqliteService {
        if (!this.sqliteService) {
            this.sqliteService = new SqliteService();
        }
        return this.sqliteService;
    }

    reset(): void {
        this.appService = null;
        this.androidDeviceService = null;
        this.settingService = null;
        this.dataService = null;
        this.sqliteService = null;
        this.productRepository = null;
        this.locationRepository = null;
        this.staffRepository = null;
        this.supplierRepository = null;
        this.inventoryDataRepository = null;
        this.stockinDataRepository = null;
        this.stockoutDataRepository = null;
    }
}