// src/domain/usecases/ImportInventoryData.ts
import { InventoryData } from '../entities/InventoryData';
import { ImportResult } from '../entities/ImportResult';
import { IInventoryDataRepository } from '../repositories/IInventoryDataRepository';

export class ImportInventoryDataUseCase {
  constructor(private inventoryDataRepository: IInventoryDataRepository) {}

  async execute(csvData: any[]): Promise<ImportResult> {
    try {
      const inventoryData: Omit<InventoryData, 'id' | 'createdAt' | 'updatedAt'>[] = [];
      const errors: string[] = [];

      for (const row of csvData) {
        try {
          if (!row.staff_code || !row.shop_code || row.shelf_number === undefined || row.shelf_position === undefined) {
            errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
            continue;
          }

          inventoryData.push({
            inputDate: String(row.input_date || '').trim(),
            staffCode: String(row.staff_code).trim(),
            shopCode: String(row.shop_code).trim(),
            shelfNumber: parseInt(row.shelf_number) || 0,
            shelfPosition: parseInt(row.shelf_position) || 0,
            janCode: row.jan_code ? String(row.jan_code).trim() : undefined,
            quantity: parseInt(row.quantity) || 0,
            cost: parseFloat(row.cost) || 0,
            price: parseInt(row.price) || 0,
            systemQuantity: parseInt(row.system_quantity) || 0,
            quantityDiscrepancy: parseInt(row.quantity_discrepancy) || 0,
            note: String(row.note || '').trim(),
            updateDate: row.update_date ? String(row.update_date).trim() : undefined,
            updateTime: row.update_time ? String(row.update_time).trim() : undefined
          });
        } catch (error) {
          errors.push(`Error processing row: ${JSON.stringify(row)} - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (inventoryData.length === 0) {
        return {
          success: false,
          message: 'No valid inventory records found',
          recordsProcessed: csvData.length,
          recordsInserted: 0,
          recordsUpdated: 0,
          errors
        };
      }

      const result = await this.inventoryDataRepository.bulkUpsert(inventoryData);

      return {
        success: true,
        message: `Successfully processed ${inventoryData.length} inventory records`,
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