// src/domain/usecases/ImportStaffData.ts
import { Staff } from '../entities/Staff';
import { ImportResult } from '../entities/ImportResult';
import { IStaffRepository } from '../repositories/IStaffRepository';

export class ImportStaffDataUseCase {
    constructor(private staffRepository: IStaffRepository) {}

    async execute(csvData: any[]): Promise<ImportResult> {
        try {
            const staff: Omit<Staff, 'createdAt' | 'updatedAt'>[] = [];
            const errors: string[] = [];

            for (const row of csvData) {
                try {
                    if (!row.staff_code || !row.staff_name) {
                        errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
                        continue;
                    }

                    staff.push({
                        staffCode: String(row.staff_code).trim(),
                        staffName: String(row.staff_name).trim(),
                    });
                } catch (error) {
                    errors.push(
                        `Error processing row: ${JSON.stringify(row)} - ${error instanceof Error ? error.message : 'Unknown error'}`,
                    );
                }
            }

            if (staff.length === 0) {
                return {
                    success: false,
                    message: 'No valid staff records found',
                    recordsProcessed: csvData.length,
                    recordsInserted: 0,
                    recordsUpdated: 0,
                    errors,
                };
            }

            const result = await this.staffRepository.bulkUpsert(staff);

            return {
                success: true,
                message: `Successfully processed ${staff.length} staff records`,
                recordsProcessed: csvData.length,
                recordsInserted: result.inserted,
                recordsUpdated: result.updated,
                errors: errors.length > 0 ? errors : undefined,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                recordsProcessed: csvData.length,
                recordsInserted: 0,
                recordsUpdated: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
        }
    }
}
