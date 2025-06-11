// src/infrastructure/repositories/ProductRepository.ts
import { Product } from '@/domain/entities/Product';
import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { SqliteService } from '../services/SqliteService';
import { Logger } from '@/shared/utils/logger';

interface DatabaseProduct {
    jan_code: string;
    product_name: string;
    box_quantity: number;
    supplier_code: string;
    created_at: string;
    updated_at: string;
}

export class ProductRepository implements IProductRepository {
    private logger = Logger.getInstance();

    constructor(private sqliteService: SqliteService) {}

    async upsertProduct(product: Omit<Product, 'createdAt' | 'updatedAt'>): Promise<Product> {
        try {
            const existingProduct = await this.getProductByCode(product.janCode);

            if (existingProduct) {
                await this.sqliteService.run(
                    'UPDATE product SET product_name = ?, box_quantity = ?, supplier_code = ?, updated_at = CURRENT_TIMESTAMP WHERE jan_code = ?',
                    [
                        product.productName,
                        product.boxQuantity,
                        product.supplierCode,
                        product.janCode,
                    ],
                );
            } else {
                await this.sqliteService.run(
                    'INSERT INTO product (jan_code, product_name, box_quantity, supplier_code) VALUES (?, ?, ?, ?)',
                    [
                        product.janCode,
                        product.productName,
                        product.boxQuantity,
                        product.supplierCode,
                    ],
                );
            }

            const updatedProduct = await this.getProductByCode(product.janCode);
            if (!updatedProduct) {
                throw new Error(`Failed to retrieve upserted product: ${product.janCode}`);
            }

            return updatedProduct;
        } catch (error) {
            this.logger.error(`Failed to upsert product ${product.janCode}:`, error as Error);
            throw error;
        }
    }

    async getProductByCode(janCode: string): Promise<Product | null> {
        try {
            const row = await this.sqliteService.get<DatabaseProduct>(
                'SELECT * FROM product WHERE jan_code = ?',
                [janCode],
            );

            if (!row) {
                return null;
            }

            return this.mapDatabaseProductToEntity(row);
        } catch (error) {
            this.logger.error(`Failed to get product ${janCode}:`, error as Error);
            return null;
        }
    }

    async getAllProducts(): Promise<Product[]> {
        try {
            const rows = await this.sqliteService.all<DatabaseProduct>(
                'SELECT * FROM product ORDER BY product_name',
            );

            return rows.map((row) => this.mapDatabaseProductToEntity(row));
        } catch (error) {
            this.logger.error('Failed to get all products:', error as Error);
            return [];
        }
    }

    async deleteProduct(janCode: string): Promise<boolean> {
        try {
            await this.sqliteService.run('DELETE FROM product WHERE jan_code = ?', [janCode]);
            return true;
        } catch (error) {
            this.logger.error(`Failed to delete product ${janCode}:`, error as Error);
            return false;
        }
    }

    async bulkUpsert(
        products: Omit<Product, 'createdAt' | 'updatedAt'>[],
    ): Promise<{ inserted: number; updated: number }> {
        let inserted = 0;
        let updated = 0;

        try {
            for (const product of products) {
                const existing = await this.getProductByCode(product.janCode);
                if (existing) {
                    await this.sqliteService.run(
                        'UPDATE product SET product_name = ?, box_quantity = ?, supplier_code = ?, updated_at = CURRENT_TIMESTAMP WHERE jan_code = ?',
                        [
                            product.productName,
                            product.boxQuantity,
                            product.supplierCode,
                            product.janCode,
                        ],
                    );
                    updated++;
                } else {
                    await this.sqliteService.run(
                        'INSERT INTO product (jan_code, product_name, box_quantity, supplier_code) VALUES (?, ?, ?, ?)',
                        [
                            product.janCode,
                            product.productName,
                            product.boxQuantity,
                            product.supplierCode,
                        ],
                    );
                    inserted++;
                }
            }

            this.logger.info(`Bulk upsert completed: ${inserted} inserted, ${updated} updated`);
            return { inserted, updated };
        } catch (error) {
            this.logger.error('Failed to bulk upsert products:', error as Error);
            throw error;
        }
    }

    private mapDatabaseProductToEntity(dbProduct: DatabaseProduct): Product {
        return {
            janCode: dbProduct.jan_code,
            productName: dbProduct.product_name,
            boxQuantity: dbProduct.box_quantity,
            supplierCode: dbProduct.supplier_code,
            createdAt: new Date(dbProduct.created_at),
            updatedAt: new Date(dbProduct.updated_at),
        };
    }
}
