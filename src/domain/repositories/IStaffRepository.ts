// src/domain/repositories/IStaffRepository.ts
import { Staff } from '../entities/Staff';

export interface IStaffRepository {
    bulkUpsert(
        staff: Omit<Staff, 'createdAt' | 'updatedAt'>[],
    ): Promise<{ inserted: number; updated: number }>;
    getAll(): Promise<Staff[]>;
    getCount(): Promise<number>;
}
