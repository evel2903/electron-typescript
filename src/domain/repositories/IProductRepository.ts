// src/domain/repositories/IProductRepository.ts - Updated with alert methods
import { Product } from '../entities/Product';

export interface IProductRepository {
    bulkUpsert(
        products: Omit<Product, 'createdAt' | 'updatedAt'>[],
    ): Promise<{ inserted: number; updated: number }>;
    getAll(): Promise<Product[]>;
    getCount(): Promise<number>;
    getProductsWithAlerts(): Promise<Product[]>;
    updateAlertThresholds(
        janCode: string,
        stockInAlert: number,
        stockOutAlert: number,
    ): Promise<boolean>;
}
