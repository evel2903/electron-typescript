// src/infrastructure/repositories/InventoryDataRepository.ts
import { InventoryData } from '@/domain/entities/InventoryData';
import { IInventoryDataRepository } from '@/domain/repositories/IInventoryDataRepository';
import { SqliteService } from '../services/SqliteService';
import { Logger } from '@/shared/utils/logger';

interface DatabaseInventoryData {
    id: number;
    input_date: string;
    staff_code: string;
    shop_code: string;
    shelf_number: number;
    shelf_position: number;
    jan_code: string | null;
    quantity: number;
    cost: number;
    price: number;
    system_quantity: number;
    quantity_discrepancy: number;
    note: string;
    update_date: string | null;
    update_time: string | null;
    created_at: string;
    updated_at: string;
}

export class InventoryDataRepository implements IInventoryDataRepository {
    private logger = Logger.getInstance();

    constructor(private sqliteService: SqliteService) {}

    async bulkUpsert(
        inventoryData: Omit<InventoryData, 'id' | 'createdAt' | 'updatedAt'>[],
    ): Promise<{ inserted: number; updated: number }> {
        let inserted = 0;
        let updated = 0;

        try {
            for (const inventory of inventoryData) {
                const existing = await this.findExistingRecord(inventory);

                if (existing) {
                    await this.sqliteService.run(
                        `UPDATE inventory_data SET 
             input_date = ?, staff_code = ?, shop_code = ?, shelf_number = ?, shelf_position = ?,
             jan_code = ?, quantity = ?, cost = ?, price = ?, system_quantity = ?,
             quantity_discrepancy = ?, note = ?, update_date = ?, update_time = ?,
             updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
                        [
                            inventory.inputDate,
                            inventory.staffCode,
                            inventory.shopCode,
                            inventory.shelfNumber,
                            inventory.shelfPosition,
                            inventory.janCode || null,
                            inventory.quantity,
                            inventory.cost,
                            inventory.price,
                            inventory.systemQuantity,
                            inventory.quantityDiscrepancy,
                            inventory.note,
                            inventory.updateDate || null,
                            inventory.updateTime || null,
                            existing.id,
                        ],
                    );
                    updated++;
                } else {
                    await this.sqliteService.run(
                        `INSERT INTO inventory_data (
             input_date, staff_code, shop_code, shelf_number, shelf_position,
             jan_code, quantity, cost, price, system_quantity,
             quantity_discrepancy, note, update_date, update_time
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            inventory.inputDate,
                            inventory.staffCode,
                            inventory.shopCode,
                            inventory.shelfNumber,
                            inventory.shelfPosition,
                            inventory.janCode || null,
                            inventory.quantity,
                            inventory.cost,
                            inventory.price,
                            inventory.systemQuantity,
                            inventory.quantityDiscrepancy,
                            inventory.note,
                            inventory.updateDate || null,
                            inventory.updateTime || null,
                        ],
                    );
                    inserted++;
                }
            }

            this.logger.info(
                `Inventory data bulk upsert completed: ${inserted} inserted, ${updated} updated`,
            );
            return { inserted, updated };
        } catch (error) {
            this.logger.error('Failed to bulk upsert inventory data:', error as Error);
            throw error;
        }
    }

    async getCount(): Promise<number> {
        try {
            const result = await this.sqliteService.get<{ count: number }>(
                'SELECT COUNT(*) as count FROM inventory_data',
            );
            return result?.count || 0;
        } catch (error) {
            this.logger.error('Failed to get inventory data count:', error as Error);
            return 0;
        }
    }

    async getByDateRange(fromDate: string, toDate: string): Promise<InventoryData[]> {
        try {
            this.logger.info(`Fetching inventory data from ${fromDate} to ${toDate}`);
            
            const rows = await this.sqliteService.all<DatabaseInventoryData>(
                'SELECT * FROM inventory_data WHERE input_date >= ? AND input_date <= ? ORDER BY input_date DESC, created_at DESC',
                [fromDate, toDate]
            );

            const result = rows.map((row) => this.mapDatabaseInventoryToEntity(row));
            this.logger.info(`Found ${result.length} inventory records in date range`);
            return result;
        } catch (error) {
            this.logger.error('Failed to get inventory data by date range:', error as Error);
            throw error;
        }
    }

    async getCountByDateRange(fromDate: string, toDate: string): Promise<number> {
        try {
            const result = await this.sqliteService.get<{ count: number }>(
                'SELECT COUNT(*) as count FROM inventory_data WHERE input_date >= ? AND input_date <= ?',
                [fromDate, toDate]
            );
            return result?.count || 0;
        } catch (error) {
            this.logger.error('Failed to get inventory data count by date range:', error as Error);
            return 0;
        }
    }

    private async findExistingRecord(
        inventory: Omit<InventoryData, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<DatabaseInventoryData | null> {
        try {
            const row = await this.sqliteService.get<DatabaseInventoryData>(
                `SELECT * FROM inventory_data 
         WHERE staff_code = ? AND shop_code = ? AND shelf_number = ? AND shelf_position = ? 
         AND input_date = ? AND (jan_code = ? OR (jan_code IS NULL AND ? IS NULL))`,
                [
                    inventory.staffCode,
                    inventory.shopCode,
                    inventory.shelfNumber,
                    inventory.shelfPosition,
                    inventory.inputDate,
                    inventory.janCode || null,
                    inventory.janCode || null,
                ],
            );

            return row || null;
        } catch (error) {
            this.logger.error('Failed to find existing inventory record:', error as Error);
            return null;
        }
    }

    private mapDatabaseInventoryToEntity(dbInventory: DatabaseInventoryData): InventoryData {
        return {
            id: dbInventory.id,
            inputDate: dbInventory.input_date,
            staffCode: dbInventory.staff_code,
            shopCode: dbInventory.shop_code,
            shelfNumber: dbInventory.shelf_number,
            shelfPosition: dbInventory.shelf_position,
            janCode: dbInventory.jan_code || undefined,
            quantity: dbInventory.quantity,
            cost: dbInventory.cost,
            price: dbInventory.price,
            systemQuantity: dbInventory.system_quantity,
            quantityDiscrepancy: dbInventory.quantity_discrepancy,
            note: dbInventory.note,
            updateDate: dbInventory.update_date || undefined,
            updateTime: dbInventory.update_time || undefined,
            createdAt: new Date(dbInventory.created_at),
            updatedAt: new Date(dbInventory.updated_at),
        };
    }
}