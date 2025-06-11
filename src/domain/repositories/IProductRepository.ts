// src/domain/repositories/IProductRepository.ts
import { Product } from '../entities/Product';

export interface IProductRepository {
    bulkUpsert(
        products: Omit<Product, 'createdAt' | 'updatedAt'>[],
    ): Promise<{ inserted: number; updated: number }>;
    getAll(): Promise<Product[]>;
    getCount(): Promise<number>;
}