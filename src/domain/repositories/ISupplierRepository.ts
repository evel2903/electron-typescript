// src/domain/repositories/ISupplierRepository.ts
import { Supplier } from '../entities/Supplier';

export interface ISupplierRepository {
    bulkUpsert(
        suppliers: Omit<Supplier, 'createdAt' | 'updatedAt'>[],
    ): Promise<{ inserted: number; updated: number }>;
    getAll(): Promise<Supplier[]>;
    getCount(): Promise<number>;
}