// src/domain/usecases/ImportProductData.ts
import { Product } from '../entities/Product';
import { ImportResult } from '../entities/ImportResult';
import { IProductRepository } from '../repositories/IProductRepository';

export class ImportProductDataUseCase {
    constructor(private productRepository: IProductRepository) {}

    async execute(csvData: any[]): Promise<ImportResult> {
        try {
            const products: Omit<Product, 'createdAt' | 'updatedAt'>[] = [];
            const errors: string[] = [];

            for (const row of csvData) {
                try {
                    if (!row.jan_code || !row.product_name) {
                        errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
                        continue;
                    }

                    products.push({
                        janCode: String(row.jan_code).trim(),
                        productName: String(row.product_name).trim(),
                        boxQuantity: parseInt(row.box_quantity) || 0,
                        supplierCode: String(row.supplier_code || '').trim(),
                    });
                } catch (error) {
                    errors.push(
                        `Error processing row: ${JSON.stringify(row)} - ${error instanceof Error ? error.message : 'Unknown error'}`,
                    );
                }
            }

            if (products.length === 0) {
                return {
                    success: false,
                    message: 'No valid product records found',
                    recordsProcessed: csvData.length,
                    recordsInserted: 0,
                    recordsUpdated: 0,
                    errors,
                };
            }

            const result = await this.productRepository.bulkUpsert(products);

            return {
                success: true,
                message: `Successfully processed ${products.length} product records`,
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
