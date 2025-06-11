// src/infrastructure/repositories/StockinDataRepository.ts
import { StockinData } from '@/domain/entities/StockinData';
import { IStockinDataRepository } from '@/domain/repositories/IStockinDataRepository';
import { SqliteService } from '../services/SqliteService';
import { Logger } from '@/shared/utils/logger';

interface DatabaseStockinData {
    id: number;
    input_date: string;
    supplier_code: string | null;
    supplier_name: string | null;
    slip_number: string;
    location: string;
    shelf_no: number;
    shelf_position: number;
    product_code: string;
    quantity: number;
    staff_code: string;
    shop_code: string;
    note: string;
    update_date: string | null;
    update_time: string | null;
    ignore_trigger: number;
    created_at: string;
    updated_at: string;
}

export class StockinDataRepository implements IStockinDataRepository {
    private logger = Logger.getInstance();

    constructor(private sqliteService: SqliteService) {}

    async bulkUpsert(
        stockinData: Omit<StockinData, 'id' | 'createdAt' | 'updatedAt'>[],
    ): Promise<{ inserted: number; updated: number }> {
        let inserted = 0;
        let updated = 0;

        try {
            for (const stockin of stockinData) {
                // Check if record exists based on unique combination of fields
                const existing = await this.findExistingRecord(stockin);

                if (existing) {
                    await this.sqliteService.run(
                        `UPDATE stockin_data SET 
             input_date = ?, supplier_code = ?, supplier_name = ?, slip_number = ?, location = ?,
             shelf_no = ?, shelf_position = ?, product_code = ?, quantity = ?, staff_code = ?,
             shop_code = ?, note = ?, update_date = ?, update_time = ?, ignore_trigger = ?,
             updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
                        [
                            stockin.inputDate,
                            stockin.supplierCode || null,
                            stockin.supplierName || null,
                            stockin.slipNumber,
                            stockin.location,
                            stockin.shelfNo,
                            stockin.shelfPosition,
                            stockin.productCode,
                            stockin.quantity,
                            stockin.staffCode,
                            stockin.shopCode,
                            stockin.note,
                            stockin.updateDate || null,
                            stockin.updateTime || null,
                            stockin.ignoreTrigger ? 1 : 0,
                            existing.id,
                        ],
                    );
                    updated++;
                } else {
                    await this.sqliteService.run(
                        `INSERT INTO stockin_data (
             input_date, supplier_code, supplier_name, slip_number, location,
             shelf_no, shelf_position, product_code, quantity, staff_code,
             shop_code, note, update_date, update_time, ignore_trigger
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            stockin.inputDate,
                            stockin.supplierCode || null,
                            stockin.supplierName || null,
                            stockin.slipNumber,
                            stockin.location,
                            stockin.shelfNo,
                            stockin.shelfPosition,
                            stockin.productCode,
                            stockin.quantity,
                            stockin.staffCode,
                            stockin.shopCode,
                            stockin.note,
                            stockin.updateDate || null,
                            stockin.updateTime || null,
                            stockin.ignoreTrigger ? 1 : 0,
                        ],
                    );
                    inserted++;
                }
            }

            this.logger.info(
                `Stockin data bulk upsert completed: ${inserted} inserted, ${updated} updated`,
            );
            return { inserted, updated };
        } catch (error) {
            this.logger.error('Failed to bulk upsert stockin data:', error as Error);
            throw error;
        }
    }

    private async findExistingRecord(
        stockin: Omit<StockinData, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<DatabaseStockinData | null> {
        try {
            // Find existing record based on business logic - slip number and product code combination
            const row = await this.sqliteService.get<DatabaseStockinData>(
                `SELECT * FROM stockin_data 
         WHERE slip_number = ? AND product_code = ? AND input_date = ? AND shop_code = ?`,
                [stockin.slipNumber, stockin.productCode, stockin.inputDate, stockin.shopCode],
            );

            return row || null;
        } catch (error) {
            this.logger.error('Failed to find existing stockin record:', error as Error);
            return null;
        }
    }
}
