// src/domain/repositories/IProductRepository.ts
import { Product } from '../entities/Product';

export interface IProductRepository {
    upsertProduct(product: Omit<Product, 'createdAt' | 'updatedAt'>): Promise<Product>;
    getProductByCode(janCode: string): Promise<Product | null>;
    getAllProducts(): Promise<Product[]>;
    deleteProduct(janCode: string): Promise<boolean>;
    bulkUpsert(
        products: Omit<Product, 'createdAt' | 'updatedAt'>[],
    ): Promise<{ inserted: number; updated: number }>;
}
