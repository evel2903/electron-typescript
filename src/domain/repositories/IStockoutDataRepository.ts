// src/domain/repositories/IStockoutDataRepository.ts
import { StockoutData } from '../entities/StockoutData';

export interface IStockoutDataRepository {
    bulkUpsert(
        stockoutData: Omit<StockoutData, 'id' | 'createdAt' | 'updatedAt'>[],
    ): Promise<{ inserted: number; updated: number }>;
    getCount(): Promise<number>;
}