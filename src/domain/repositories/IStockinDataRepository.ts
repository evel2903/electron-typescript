// src/domain/repositories/IStockinDataRepository.ts
import { StockinData } from '../entities/StockinData';

export interface IStockinDataRepository {
    bulkUpsert(
        stockinData: Omit<StockinData, 'id' | 'createdAt' | 'updatedAt'>[],
    ): Promise<{ inserted: number; updated: number }>;
    getCount(): Promise<number>;
    getByDateRange(fromDate: string, toDate: string): Promise<StockinData[]>;
    getCountByDateRange(fromDate: string, toDate: string): Promise<number>;
}
