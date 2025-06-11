// src/infrastructure/repositories/StaffRepository.ts
import { Staff } from '@/domain/entities/Staff';
import { IStaffRepository } from '@/domain/repositories/IStaffRepository';
import { SqliteService } from '../services/SqliteService';
import { Logger } from '@/shared/utils/logger';

interface DatabaseStaff {
    staff_code: string;
    staff_name: string;
    created_at: string;
    updated_at: string;
}

export class StaffRepository implements IStaffRepository {
    private logger = Logger.getInstance();

    constructor(private sqliteService: SqliteService) {}

    async bulkUpsert(
        staff: Omit<Staff, 'createdAt' | 'updatedAt'>[],
    ): Promise<{ inserted: number; updated: number }> {
        let inserted = 0;
        let updated = 0;

        try {
            for (const staffMember of staff) {
                const existing = await this.getStaffByCode(staffMember.staffCode);
                if (existing) {
                    await this.sqliteService.run(
                        'UPDATE staff SET staff_name = ?, updated_at = CURRENT_TIMESTAMP WHERE staff_code = ?',
                        [staffMember.staffName, staffMember.staffCode],
                    );
                    updated++;
                } else {
                    await this.sqliteService.run(
                        'INSERT INTO staff (staff_code, staff_name) VALUES (?, ?)',
                        [staffMember.staffCode, staffMember.staffName],
                    );
                    inserted++;
                }
            }

            this.logger.info(`Bulk upsert completed: ${inserted} inserted, ${updated} updated`);
            return { inserted, updated };
        } catch (error) {
            this.logger.error('Failed to bulk upsert staff:', error as Error);
            throw error;
        }
    }

    async getAll(): Promise<Staff[]> {
        try {
            const rows = await this.sqliteService.all<DatabaseStaff>(
                'SELECT * FROM staff ORDER BY staff_name',
            );

            return rows.map((row) => this.mapDatabaseStaffToEntity(row));
        } catch (error) {
            this.logger.error('Failed to get all staff:', error as Error);
            return [];
        }
    }

    async getCount(): Promise<number> {
        try {
            const result = await this.sqliteService.get<{ count: number }>(
                'SELECT COUNT(*) as count FROM staff',
            );
            return result?.count || 0;
        } catch (error) {
            this.logger.error('Failed to get staff count:', error as Error);
            return 0;
        }
    }

    private async getStaffByCode(staffCode: string): Promise<Staff | null> {
        try {
            const row = await this.sqliteService.get<DatabaseStaff>(
                'SELECT * FROM staff WHERE staff_code = ?',
                [staffCode],
            );

            if (!row) {
                return null;
            }

            return this.mapDatabaseStaffToEntity(row);
        } catch (error) {
            this.logger.error(`Failed to get staff ${staffCode}:`, error as Error);
            return null;
        }
    }

    private mapDatabaseStaffToEntity(dbStaff: DatabaseStaff): Staff {
        return {
            staffCode: dbStaff.staff_code,
            staffName: dbStaff.staff_name,
            createdAt: new Date(dbStaff.created_at),
            updatedAt: new Date(dbStaff.updated_at),
        };
    }
}