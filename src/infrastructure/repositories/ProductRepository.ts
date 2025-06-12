// src/infrastructure/repositories/ProductRepository.ts - Updated with alert fields
import { Product } from '@/domain/entities/Product';
import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { SqliteService } from '../services/SqliteService';
import { Logger } from '@/shared/utils/logger';

interface DatabaseProduct {
    jan_code: string;
    product_name: string;
    box_quantity: number;
    supplier_code: string;
    stock_in_alert: number;
    stock_out_alert: number;
    created_at: string;
    updated_at: string;
}

export class ProductRepository implements IProductRepository {
    private logger = Logger.getInstance();

    constructor(private sqliteService: SqliteService) {}

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
                        `UPDATE product SET 
                         product_name = ?, 
                         box_quantity = ?, 
                         supplier_code = ?, 
                         stock_in_alert = ?, 
                         stock_out_alert = ?, 
                         updated_at = CURRENT_TIMESTAMP 
                         WHERE jan_code = ?`,
                        [
                            product.productName,
                            product.boxQuantity,
                            product.supplierCode,
                            product.stockInAlert,
                            product.stockOutAlert,
                            product.janCode,
                        ],
                    );
                    updated++;
                } else {
                    await this.sqliteService.run(
                        `INSERT INTO product 
                         (jan_code, product_name, box_quantity, supplier_code, stock_in_alert, stock_out_alert) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            product.janCode,
                            product.productName,
                            product.boxQuantity,
                            product.supplierCode,
                            product.stockInAlert,
                            product.stockOutAlert,
                        ],
                    );
                    inserted++;
                }
            }

            this.logger.info(
                `Product bulk upsert completed: ${inserted} inserted, ${updated} updated`,
            );
            return { inserted, updated };
        } catch (error) {
            this.logger.error('Failed to bulk upsert products:', error as Error);
            throw error;
        }
    }

    async getAll(): Promise<Product[]> {
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

    async getCount(): Promise<number> {
        try {
            const result = await this.sqliteService.get<{ count: number }>(
                'SELECT COUNT(*) as count FROM product',
            );
            return result?.count || 0;
        } catch (error) {
            this.logger.error('Failed to get product count:', error as Error);
            return 0;
        }
    }

    async getProductsWithAlerts(): Promise<Product[]> {
        try {
            const rows = await this.sqliteService.all<DatabaseProduct>(
                'SELECT * FROM product WHERE stock_in_alert > 0 OR stock_out_alert > 0 ORDER BY product_name',
            );

            return rows.map((row) => this.mapDatabaseProductToEntity(row));
        } catch (error) {
            this.logger.error('Failed to get products with alerts:', error as Error);
            return [];
        }
    }

    async updateAlertThresholds(
        janCode: string,
        stockInAlert: number,
        stockOutAlert: number,
    ): Promise<boolean> {
        try {
            await this.sqliteService.run(
                'UPDATE product SET stock_in_alert = ?, stock_out_alert = ?, updated_at = CURRENT_TIMESTAMP WHERE jan_code = ?',
                [stockInAlert, stockOutAlert, janCode],
            );

            this.logger.info(
                `Updated alert thresholds for product ${janCode}: stockIn=${stockInAlert}, stockOut=${stockOutAlert}`,
            );
            return true;
        } catch (error) {
            this.logger.error(
                `Failed to update alert thresholds for product ${janCode}:`,
                error as Error,
            );
            return false;
        }
    }

    private async getProductByCode(janCode: string): Promise<Product | null> {
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

    private mapDatabaseProductToEntity(dbProduct: DatabaseProduct): Product {
        return {
            janCode: dbProduct.jan_code,
            productName: dbProduct.product_name,
            boxQuantity: dbProduct.box_quantity,
            supplierCode: dbProduct.supplier_code,
            stockInAlert: dbProduct.stock_in_alert || 0,
            stockOutAlert: dbProduct.stock_out_alert || 0,
            createdAt: new Date(dbProduct.created_at),
            updatedAt: new Date(dbProduct.updated_at),
        };
    }
}
