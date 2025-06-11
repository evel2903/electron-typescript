// src/domain/repositories/IStaffRepository.ts
import { Staff } from '../entities/Staff';

export interface IStaffRepository {
    upsertStaff(staff: Omit<Staff, 'createdAt' | 'updatedAt'>): Promise<Staff>;
    getStaffByCode(staffCode: string): Promise<Staff | null>;
    getAllStaff(): Promise<Staff[]>;
    deleteStaff(staffCode: string): Promise<boolean>;
    bulkUpsert(
        staff: Omit<Staff, 'createdAt' | 'updatedAt'>[],
    ): Promise<{ inserted: number; updated: number }>;
}
