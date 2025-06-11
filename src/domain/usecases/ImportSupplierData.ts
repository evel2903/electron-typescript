// src/domain/usecases/ImportSupplierData.ts
import { Supplier } from '../entities/Supplier';
import { ImportResult } from '../entities/ImportResult';
import { ISupplierRepository } from '../repositories/ISupplierRepository';

export class ImportSupplierDataUseCase {
    constructor(private supplierRepository: ISupplierRepository) {}

    async execute(csvData: any[]): Promise<ImportResult> {
        try {
            const suppliers: Omit<Supplier, 'createdAt' | 'updatedAt'>[] = [];
            const errors: string[] = [];

            for (const row of csvData) {
                try {
                    if (!row.supplier_code || !row.supplier_name) {
                        errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
                        continue;
                    }

                    suppliers.push({
                        supplierCode: String(row.supplier_code).trim(),
                        supplierName: String(row.supplier_name).trim(),
                    });
                } catch (error) {
                    errors.push(
                        `Error processing row: ${JSON.stringify(row)} - ${error instanceof Error ? error.message : 'Unknown error'}`,
                    );
                }
            }

            if (suppliers.length === 0) {
                return {
                    success: false,
                    message: 'No valid supplier records found',
                    recordsProcessed: csvData.length,
                    recordsInserted: 0,
                    recordsUpdated: 0,
                    errors,
                };
            }

            const result = await this.supplierRepository.bulkUpsert(suppliers);

            return {
                success: true,
                message: `Successfully processed ${suppliers.length} supplier records`,
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
