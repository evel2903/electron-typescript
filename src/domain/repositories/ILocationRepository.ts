// src/domain/repositories/ILocationRepository.ts
import { Location } from '../entities/Location';

export interface ILocationRepository {
    bulkUpsert(
        locations: Omit<Location, 'createdAt' | 'updatedAt'>[],
    ): Promise<{ inserted: number; updated: number }>;
    getAll(): Promise<Location[]>;
    getCount(): Promise<number>;
}