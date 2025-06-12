// src/application/services/DataService.ts
import { Product } from '@/domain/entities/Product';
import { Location } from '@/domain/entities/Location';
import { Staff } from '@/domain/entities/Staff';
import { Supplier } from '@/domain/entities/Supplier';
import { InventoryData } from '@/domain/entities/InventoryData';
import { StockinData } from '@/domain/entities/StockinData';
import { StockoutData } from '@/domain/entities/StockoutData';
import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { ILocationRepository } from '@/domain/repositories/ILocationRepository';
import { IStaffRepository } from '@/domain/repositories/IStaffRepository';
import { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import { IInventoryDataRepository } from '@/domain/repositories/IInventoryDataRepository';
import { IStockinDataRepository } from '@/domain/repositories/IStockinDataRepository';
import { IStockoutDataRepository } from '@/domain/repositories/IStockoutDataRepository';

export interface DataCounts {
    inventory: number;
    stockin: number;
    stockout: number;
    products: number;
    locations: number;
    staff: number;
    suppliers: number;
}

export interface AllData {
    products: Product[];
    locations: Location[];
    staff: Staff[];
    suppliers: Supplier[];
}

export interface DateRangeFilter {
    fromDate: string; // Format: YYYY/MM/DD
    toDate: string;   // Format: YYYY/MM/DD
}

export interface FilteredDataCounts {
    inventory: number;
    stockin: number;
    stockout: number;
}

export interface FilteredTransactionData {
    inventoryData: InventoryData[];
    stockinData: StockinData[];
    stockoutData: StockoutData[];
}

export class DataService {
    constructor(
        private inventoryRepository: IInventoryDataRepository,
        private stockinRepository: IStockinDataRepository,
        private stockoutRepository: IStockoutDataRepository,
        private productRepository: IProductRepository,
        private locationRepository: ILocationRepository,
        private staffRepository: IStaffRepository,
        private supplierRepository: ISupplierRepository,
    ) {}

    async getDataCounts(): Promise<DataCounts> {
        try {
            const [inventory, stockin, stockout, products, locations, staff, suppliers] =
                await Promise.all([
                    this.inventoryRepository.getCount(),
                    this.stockinRepository.getCount(),
                    this.stockoutRepository.getCount(),
                    this.productRepository.getCount(),
                    this.locationRepository.getCount(),
                    this.staffRepository.getCount(),
                    this.supplierRepository.getCount(),
                ]);

            return {
                inventory,
                stockin,
                stockout,
                products,
                locations,
                staff,
                suppliers,
            };
        } catch (error) {
            console.error('Error getting data counts:', error);
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

    async getDataCountsByDateRange(dateRange: DateRangeFilter): Promise<FilteredDataCounts> {
        try {
            const [inventory, stockin, stockout] = await Promise.all([
                this.inventoryRepository.getCountByDateRange(dateRange.fromDate, dateRange.toDate),
                this.stockinRepository.getCountByDateRange(dateRange.fromDate, dateRange.toDate),
                this.stockoutRepository.getCountByDateRange(dateRange.fromDate, dateRange.toDate),
            ]);

            return {
                inventory,
                stockin,
                stockout,
            };
        } catch (error) {
            console.error('Error getting data counts by date range:', error);
            return {
                inventory: 0,
                stockin: 0,
                stockout: 0,
            };
        }
    }

    async getTransactionDataByDateRange(dateRange: DateRangeFilter): Promise<FilteredTransactionData> {
        try {
            const [inventoryData, stockinData, stockoutData] = await Promise.all([
                this.inventoryRepository.getByDateRange(dateRange.fromDate, dateRange.toDate),
                this.stockinRepository.getByDateRange(dateRange.fromDate, dateRange.toDate),
                this.stockoutRepository.getByDateRange(dateRange.fromDate, dateRange.toDate),
            ]);

            return {
                inventoryData,
                stockinData,
                stockoutData,
            };
        } catch (error) {
            console.error('Error getting transaction data by date range:', error);
            return {
                inventoryData: [],
                stockinData: [],
                stockoutData: [],
            };
        }
    }

    async getInventoryDataByDateRange(fromDate: string, toDate: string): Promise<InventoryData[]> {
        try {
            return await this.inventoryRepository.getByDateRange(fromDate, toDate);
        } catch (error) {
            console.error('Error getting inventory data by date range:', error);
            return [];
        }
    }

    async getStockinDataByDateRange(fromDate: string, toDate: string): Promise<StockinData[]> {
        try {
            return await this.stockinRepository.getByDateRange(fromDate, toDate);
        } catch (error) {
            console.error('Error getting stockin data by date range:', error);
            return [];
        }
    }

    async getStockoutDataByDateRange(fromDate: string, toDate: string): Promise<StockoutData[]> {
        try {
            return await this.stockoutRepository.getByDateRange(fromDate, toDate);
        } catch (error) {
            console.error('Error getting stockout data by date range:', error);
            return [];
        }
    }

    async getAllMasterData(): Promise<AllData> {
        try {
            const [products, locations, staff, suppliers] = await Promise.all([
                this.productRepository.getAll(),
                this.locationRepository.getAll(),
                this.staffRepository.getAll(),
                this.supplierRepository.getAll(),
            ]);

            return {
                products,
                locations,
                staff,
                suppliers,
            };
        } catch (error) {
            console.error('Error getting all master data:', error);
            return {
                products: [],
                locations: [],
                staff: [],
                suppliers: [],
            };
        }
    }

    async getProducts(): Promise<Product[]> {
        try {
            return await this.productRepository.getAll();
        } catch (error) {
            console.error('Error getting products:', error);
            return [];
        }
    }

    async getLocations(): Promise<Location[]> {
        try {
            return await this.locationRepository.getAll();
        } catch (error) {
            console.error('Error getting locations:', error);
            return [];
        }
    }

    async getStaff(): Promise<Staff[]> {
        try {
            return await this.staffRepository.getAll();
        } catch (error) {
            console.error('Error getting staff:', error);
            return [];
        }
    }

    async getSuppliers(): Promise<Supplier[]> {
        try {
            return await this.supplierRepository.getAll();
        } catch (error) {
            console.error('Error getting suppliers:', error);
            return [];
        }
    }

    async getInventoryDataCount(): Promise<number> {
        try {
            return await this.inventoryRepository.getCount();
        } catch (error) {
            console.error('Error getting inventory data count:', error);
            return 0;
        }
    }

    async getStockinDataCount(): Promise<number> {
        try {
            return await this.stockinRepository.getCount();
        } catch (error) {
            console.error('Error getting stockin data count:', error);
            return 0;
        }
    }

    async getStockoutDataCount(): Promise<number> {
        try {
            return await this.stockoutRepository.getCount();
        } catch (error) {
            console.error('Error getting stockout data count:', error);
            return 0;
        }
    }
}