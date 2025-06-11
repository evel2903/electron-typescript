// src/domain/repositories/ILocationRepository.ts
import { Location } from '../entities/Location';

export interface ILocationRepository {
  upsertLocation(location: Omit<Location, 'createdAt' | 'updatedAt'>): Promise<Location>;
  getLocationByCode(shopCode: string): Promise<Location | null>;
  getAllLocations(): Promise<Location[]>;
  deleteLocation(shopCode: string): Promise<boolean>;
  bulkUpsert(locations: Omit<Location, 'createdAt' | 'updatedAt'>[]): Promise<{ inserted: number; updated: number }>;
}