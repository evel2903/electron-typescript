// src/infrastructure/repositories/StockoutDataRepository.ts
import { StockoutData } from '@/domain/entities/StockoutData';
import { IStockoutDataRepository } from '@/domain/repositories/IStockoutDataRepository';
import { SqliteService } from '../services/SqliteService';
import { Logger } from '@/shared/utils/logger';

interface DatabaseStockoutData {
  id: number;
  input_date: string;
  supplier_code: string;
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
  dept_code: string;
  dept_name: string;
  ignore_trigger: number;
  created_at: string;
  updated_at: string;
}

export class StockoutDataRepository implements IStockoutDataRepository {
  private logger = Logger.getInstance();

  constructor(private sqliteService: SqliteService) {}

  async bulkUpsert(stockoutData: Omit<StockoutData, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;

    try {
      for (const stockout of stockoutData) {
        // Check if record exists based on unique combination of fields
        const existing = await this.findExistingRecord(stockout);
        
        if (existing) {
          await this.sqliteService.run(
            `UPDATE stockout_data SET 
             input_date = ?, supplier_code = ?, slip_number = ?, location = ?, shelf_no = ?,
             shelf_position = ?, product_code = ?, quantity = ?, staff_code = ?, shop_code = ?,
             note = ?, update_date = ?, update_time = ?, dept_code = ?, dept_name = ?,
             ignore_trigger = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [
              stockout.inputDate,
              stockout.supplierCode,
              stockout.slipNumber,
              stockout.location,
              stockout.shelfNo,
              stockout.shelfPosition,
              stockout.productCode,
              stockout.quantity,
              stockout.staffCode,
              stockout.shopCode,
              stockout.note,
              stockout.updateDate || null,
              stockout.updateTime || null,
              stockout.deptCode,
              stockout.deptName,
              stockout.ignoreTrigger ? 1 : 0,
              existing.id
            ]
          );
          updated++;
        } else {
          await this.sqliteService.run(
            `INSERT INTO stockout_data (
             input_date, supplier_code, slip_number, location, shelf_no,
             shelf_position, product_code, quantity, staff_code, shop_code,
             note, update_date, update_time, dept_code, dept_name, ignore_trigger
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              stockout.inputDate,
              stockout.supplierCode,
              stockout.slipNumber,
              stockout.location,
              stockout.shelfNo,
              stockout.shelfPosition,
              stockout.productCode,
              stockout.quantity,
              stockout.staffCode,
              stockout.shopCode,
              stockout.note,
              stockout.updateDate || null,
              stockout.updateTime || null,
              stockout.deptCode,
              stockout.deptName,
              stockout.ignoreTrigger ? 1 : 0
            ]
          );
          inserted++;
        }
      }

      this.logger.info(`Stockout data bulk upsert completed: ${inserted} inserted, ${updated} updated`);
      return { inserted, updated };
    } catch (error) {
      this.logger.error('Failed to bulk upsert stockout data:', error as Error);
      throw error;
    }
  }

  private async findExistingRecord(stockout: Omit<StockoutData, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseStockoutData | null> {
    try {
      // Find existing record based on business logic - slip number and product code combination
      const row = await this.sqliteService.get<DatabaseStockoutData>(
        `SELECT * FROM stockout_data 
         WHERE slip_number = ? AND product_code = ? AND input_date = ? AND shop_code = ?`,
        [
          stockout.slipNumber,
          stockout.productCode,
          stockout.inputDate,
          stockout.shopCode
        ]
      );

      return row || null;
    } catch (error) {
      this.logger.error('Failed to find existing stockout record:', error as Error);
      return null;
    }
  }
}