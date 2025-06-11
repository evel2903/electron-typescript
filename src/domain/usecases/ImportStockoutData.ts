// src/domain/usecases/ImportStockoutData.ts
import { StockoutData } from '../entities/StockoutData';
import { ImportResult } from '../entities/ImportResult';
import { IStockoutDataRepository } from '../repositories/IStockoutDataRepository';

export class ImportStockoutDataUseCase {
  constructor(private stockoutDataRepository: IStockoutDataRepository) {}

  async execute(csvData: any[]): Promise<ImportResult> {
    try {
      const stockoutData: Omit<StockoutData, 'id' | 'createdAt' | 'updatedAt'>[] = [];
      const errors: string[] = [];

      for (const row of csvData) {
        try {
          if (!row.input_date || !row.supplier_code || !row.slip_number || !row.location || 
              !row.product_code || !row.staff_code || !row.shop_code || !row.dept_code || !row.dept_name) {
            errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
            continue;
          }

          stockoutData.push({
            inputDate: String(row.input_date).trim(),
            supplierCode: String(row.supplier_code).trim(),
            slipNumber: String(row.slip_number).trim(),
            location: String(row.location).trim(),
            shelfNo: parseInt(row.shelf_no) || 0,
            shelfPosition: parseInt(row.shelf_position) || 0,
            productCode: String(row.product_code).trim(),
            quantity: parseInt(row.quantity) || 0,
            staffCode: String(row.staff_code).trim(),
            shopCode: String(row.shop_code).trim(),
            note: String(row.note || '').trim(),
            updateDate: row.update_date ? String(row.update_date).trim() : undefined,
            updateTime: row.update_time ? String(row.update_time).trim() : undefined,
            deptCode: String(row.dept_code).trim(),
            deptName: String(row.dept_name).trim(),
            ignoreTrigger: Boolean(parseInt(row.ignore_trigger) || 0)
          });
        } catch (error) {
          errors.push(`Error processing row: ${JSON.stringify(row)} - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (stockoutData.length === 0) {
        return {
          success: false,
          message: 'No valid stockout records found',
          recordsProcessed: csvData.length,
          recordsInserted: 0,
          recordsUpdated: 0,
          errors
        };
      }

      const result = await this.stockoutDataRepository.bulkUpsert(stockoutData);

      return {
        success: true,
        message: `Successfully processed ${stockoutData.length} stockout records`,
        recordsProcessed: csvData.length,
        recordsInserted: result.inserted,
        recordsUpdated: result.updated,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        recordsProcessed: csvData.length,
        recordsInserted: 0,
        recordsUpdated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}