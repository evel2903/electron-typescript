// src/infrastructure/repositories/LocationRepository.ts
import { Location } from '@/domain/entities/Location';
import { ILocationRepository } from '@/domain/repositories/ILocationRepository';
import { SqliteService } from '../services/SqliteService';
import { Logger } from '@/shared/utils/logger';

interface DatabaseLocation {
    shop_code: string;
    shop_name: string;
    created_at: string;
    updated_at: string;
}

export class LocationRepository implements ILocationRepository {
    private logger = Logger.getInstance();

    constructor(private sqliteService: SqliteService) {}

    async upsertLocation(location: Omit<Location, 'createdAt' | 'updatedAt'>): Promise<Location> {
        try {
            const existingLocation = await this.getLocationByCode(location.shopCode);

            if (existingLocation) {
                await this.sqliteService.run(
                    'UPDATE location SET shop_name = ?, updated_at = CURRENT_TIMESTAMP WHERE shop_code = ?',
                    [location.shopName, location.shopCode],
                );
            } else {
                await this.sqliteService.run(
                    'INSERT INTO location (shop_code, shop_name) VALUES (?, ?)',
                    [location.shopCode, location.shopName],
                );
            }

            const updatedLocation = await this.getLocationByCode(location.shopCode);
            if (!updatedLocation) {
                throw new Error(`Failed to retrieve upserted location: ${location.shopCode}`);
            }

            return updatedLocation;
        } catch (error) {
            this.logger.error(`Failed to upsert location ${location.shopCode}:`, error as Error);
            throw error;
        }
    }

    async getLocationByCode(shopCode: string): Promise<Location | null> {
        try {
            const row = await this.sqliteService.get<DatabaseLocation>(
                'SELECT * FROM location WHERE shop_code = ?',
                [shopCode],
            );

            if (!row) {
                return null;
            }

            return this.mapDatabaseLocationToEntity(row);
        } catch (error) {
            this.logger.error(`Failed to get location ${shopCode}:`, error as Error);
            return null;
        }
    }

    async getAllLocations(): Promise<Location[]> {
        try {
            const rows = await this.sqliteService.all<DatabaseLocation>(
                'SELECT * FROM location ORDER BY shop_name',
            );

            return rows.map((row) => this.mapDatabaseLocationToEntity(row));
        } catch (error) {
            this.logger.error('Failed to get all locations:', error as Error);
            return [];
        }
    }

    async deleteLocation(shopCode: string): Promise<boolean> {
        try {
            await this.sqliteService.run('DELETE FROM location WHERE shop_code = ?', [shopCode]);
            return true;
        } catch (error) {
            this.logger.error(`Failed to delete location ${shopCode}:`, error as Error);
            return false;
        }
    }

    async bulkUpsert(
        locations: Omit<Location, 'createdAt' | 'updatedAt'>[],
    ): Promise<{ inserted: number; updated: number }> {
        let inserted = 0;
        let updated = 0;

        try {
            for (const location of locations) {
                const existing = await this.getLocationByCode(location.shopCode);
                if (existing) {
                    await this.sqliteService.run(
                        'UPDATE location SET shop_name = ?, updated_at = CURRENT_TIMESTAMP WHERE shop_code = ?',
                        [location.shopName, location.shopCode],
                    );
                    updated++;
                } else {
                    await this.sqliteService.run(
                        'INSERT INTO location (shop_code, shop_name) VALUES (?, ?)',
                        [location.shopCode, location.shopName],
                    );
                    inserted++;
                }
            }

            this.logger.info(`Bulk upsert completed: ${inserted} inserted, ${updated} updated`);
            return { inserted, updated };
        } catch (error) {
            this.logger.error('Failed to bulk upsert locations:', error as Error);
            throw error;
        }
    }

    private mapDatabaseLocationToEntity(dbLocation: DatabaseLocation): Location {
        return {
            shopCode: dbLocation.shop_code,
            shopName: dbLocation.shop_name,
            createdAt: new Date(dbLocation.created_at),
            updatedAt: new Date(dbLocation.updated_at),
        };
    }
}
