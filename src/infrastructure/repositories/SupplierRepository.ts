// src/infrastructure/repositories/SupplierRepository.ts
import { Supplier } from '@/domain/entities/Supplier';
import { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import { SqliteService } from '../services/SqliteService';
import { Logger } from '@/shared/utils/logger';

interface DatabaseSupplier {
    supplier_code: string;
    supplier_name: string;
    created_at: string;
    updated_at: string;
}

export class SupplierRepository implements ISupplierRepository {
    private logger = Logger.getInstance();

    constructor(private sqliteService: SqliteService) {}

    async bulkUpsert(
        suppliers: Omit<Supplier, 'createdAt' | 'updatedAt'>[],
    ): Promise<{ inserted: number; updated: number }> {
        let inserted = 0;
        let updated = 0;

        try {
            for (const supplier of suppliers) {
                const existing = await this.getSupplierByCode(supplier.supplierCode);
                if (existing) {
                    await this.sqliteService.run(
                        'UPDATE supplier SET supplier_name = ?, updated_at = CURRENT_TIMESTAMP WHERE supplier_code = ?',
                        [supplier.supplierName, supplier.supplierCode],
                    );
                    updated++;
                } else {
                    await this.sqliteService.run(
                        'INSERT INTO supplier (supplier_code, supplier_name) VALUES (?, ?)',
                        [supplier.supplierCode, supplier.supplierName],
                    );
                    inserted++;
                }
            }

            this.logger.info(`Bulk upsert completed: ${inserted} inserted, ${updated} updated`);
            return { inserted, updated };
        } catch (error) {
            this.logger.error('Failed to bulk upsert suppliers:', error as Error);
            throw error;
        }
    }

    async getAll(): Promise<Supplier[]> {
        try {
            const rows = await this.sqliteService.all<DatabaseSupplier>(
                'SELECT * FROM supplier ORDER BY supplier_name',
            );

            return rows.map((row) => this.mapDatabaseSupplierToEntity(row));
        } catch (error) {
            this.logger.error('Failed to get all suppliers:', error as Error);
            return [];
        }
    }

    async getCount(): Promise<number> {
        try {
            const result = await this.sqliteService.get<{ count: number }>(
                'SELECT COUNT(*) as count FROM supplier',
            );
            return result?.count || 0;
        } catch (error) {
            this.logger.error('Failed to get supplier count:', error as Error);
            return 0;
        }
    }

    private async getSupplierByCode(supplierCode: string): Promise<Supplier | null> {
        try {
            const row = await this.sqliteService.get<DatabaseSupplier>(
                'SELECT * FROM supplier WHERE supplier_code = ?',
                [supplierCode],
            );

            if (!row) {
                return null;
            }

            return this.mapDatabaseSupplierToEntity(row);
        } catch (error) {
            this.logger.error(`Failed to get supplier ${supplierCode}:`, error as Error);
            return null;
        }
    }

    private mapDatabaseSupplierToEntity(dbSupplier: DatabaseSupplier): Supplier {
        return {
            supplierCode: dbSupplier.supplier_code,
            supplierName: dbSupplier.supplier_name,
            createdAt: new Date(dbSupplier.created_at),
            updatedAt: new Date(dbSupplier.updated_at),
        };
    }
}