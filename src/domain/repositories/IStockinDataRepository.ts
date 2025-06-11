// src/domain/repositories/IStockinDataRepository.ts
import { StockinData } from '../entities/StockinData';

export interface IStockinDataRepository {
  bulkUpsert(stockinData: Omit<StockinData, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<{ inserted: number; updated: number }>;
}