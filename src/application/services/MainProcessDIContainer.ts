// src/application/services/MainProcessDIContainer.ts - DI Container for Main Process
import { DataService } from './DataService';
import { ProductRepository } from '@/infrastructure/repositories/ProductRepository';
import { LocationRepository } from '@/infrastructure/repositories/LocationRepository';
import { StaffRepository } from '@/infrastructure/repositories/StaffRepository';
import { SupplierRepository } from '@/infrastructure/repositories/SupplierRepository';
import { InventoryDataRepository } from '@/infrastructure/repositories/InventoryDataRepository';
import { StockinDataRepository } from '@/infrastructure/repositories/StockinDataRepository';
import { StockoutDataRepository } from '@/infrastructure/repositories/StockoutDataRepository';
import { SqliteService } from '@/infrastructure/services/SqliteService';

/**
 * Dependency Injection Container for the Main Process
 * This container provides all services and repositories needed for the main process,
 * including direct database access through repositories.
 */
export class MainProcessDIContainer {
    private static instance: MainProcessDIContainer;
    private dataService: DataService | null = null;

    // Core services
    private sqliteService: SqliteService | null = null;

    // Repository instances
    private productRepository: ProductRepository | null = null;
    private locationRepository: LocationRepository | null = null;
    private staffRepository: StaffRepository | null = null;
    private supplierRepository: SupplierRepository | null = null;
    private inventoryDataRepository: InventoryDataRepository | null = null;
    private stockinDataRepository: StockinDataRepository | null = null;
    private stockoutDataRepository: StockoutDataRepository | null = null;

    private constructor() {}

    static getInstance(): MainProcessDIContainer {
        if (!MainProcessDIContainer.instance) {
            MainProcessDIContainer.instance = new MainProcessDIContainer();
        }
        return MainProcessDIContainer.instance;
    }

    /**
     * Get SQLite Service - Core database service
     */
    getSqliteService(): SqliteService {
        if (!this.sqliteService) {
            this.sqliteService = new SqliteService();
        }
        return this.sqliteService;
    }

    /**
     * Get Data Service - High-level service for data operations
     */
    getDataService(): DataService {
        if (!this.dataService) {
            // Create DataService with all required repositories
            this.dataService = new DataService(
                this.getInventoryDataRepository(),
                this.getStockinDataRepository(),
                this.getStockoutDataRepository(),
                this.getProductRepository(),
                this.getLocationRepository(),
                this.getStaffRepository(),
                this.getSupplierRepository(),
            );
        }
        return this.dataService;
    }

    /**
     * Get Product Repository
     */
    getProductRepository(): ProductRepository {
        if (!this.productRepository) {
            this.productRepository = new ProductRepository(this.getSqliteService());
        }
        return this.productRepository;
    }

    /**
     * Get Location Repository
     */
    getLocationRepository(): LocationRepository {
        if (!this.locationRepository) {
            this.locationRepository = new LocationRepository(this.getSqliteService());
        }
        return this.locationRepository;
    }

    /**
     * Get Staff Repository
     */
    getStaffRepository(): StaffRepository {
        if (!this.staffRepository) {
            this.staffRepository = new StaffRepository(this.getSqliteService());
        }
        return this.staffRepository;
    }

    /**
     * Get Supplier Repository
     */
    getSupplierRepository(): SupplierRepository {
        if (!this.supplierRepository) {
            this.supplierRepository = new SupplierRepository(this.getSqliteService());
        }
        return this.supplierRepository;
    }

    /**
     * Get Inventory Data Repository
     */
    getInventoryDataRepository(): InventoryDataRepository {
        if (!this.inventoryDataRepository) {
            this.inventoryDataRepository = new InventoryDataRepository(this.getSqliteService());
        }
        return this.inventoryDataRepository;
    }

    /**
     * Get Stockin Data Repository
     */
    getStockinDataRepository(): StockinDataRepository {
        if (!this.stockinDataRepository) {
            this.stockinDataRepository = new StockinDataRepository(this.getSqliteService());
        }
        return this.stockinDataRepository;
    }

    /**
     * Get Stockout Data Repository
     */
    getStockoutDataRepository(): StockoutDataRepository {
        if (!this.stockoutDataRepository) {
            this.stockoutDataRepository = new StockoutDataRepository(this.getSqliteService());
        }
        return this.stockoutDataRepository;
    }

    /**
     * Reset all services and repositories (useful for testing or cleanup)
     */
    reset(): void {
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

    /**
     * Initialize all core services and ensure database connection
     */
    async initialize(): Promise<boolean> {
        try {
            const sqliteService = this.getSqliteService();
            const connected = await sqliteService.connect();

            if (!connected) {
                console.error('Failed to connect to database');
                return false;
            }

            const schemaInitialized = await sqliteService.initializeSchema();

            if (!schemaInitialized) {
                console.error('Failed to initialize database schema');
                return false;
            }

            console.log('Main process DI container initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize main process DI container:', error);
            return false;
        }
    }

    /**
     * Cleanup resources and close database connections
     */
    async cleanup(): Promise<void> {
        try {
            if (this.sqliteService) {
                await this.sqliteService.disconnect();
            }
            this.reset();
            console.log('Main process DI container cleaned up successfully');
        } catch (error) {
            console.error('Error during main process DI container cleanup:', error);
        }
    }
}
