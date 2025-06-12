// src/domain/repositories/IInventoryDataRepository.ts
import { InventoryData } from '../entities/InventoryData';

export interface IInventoryDataRepository {
    bulkUpsert(
        inventoryData: Omit<InventoryData, 'id' | 'createdAt' | 'updatedAt'>[],
    ): Promise<{ inserted: number; updated: number }>;
    getCount(): Promise<number>;
    getByDateRange(fromDate: string, toDate: string): Promise<InventoryData[]>;
    getCountByDateRange(fromDate: string, toDate: string): Promise<number>;
}
