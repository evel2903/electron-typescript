// src/infrastructure/services/DataSyncService.ts - Updated with product_mst sync
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import Database from 'better-sqlite3';
import { AdbService } from './AdbService';
import { SqliteService } from './SqliteService';
import { Logger } from '@/shared/utils/logger';

export interface SyncResult {
    tableName: string;
    recordsFound: number;
    recordsInserted: number;
    recordsUpdated: number;
    success: boolean;
    error?: string;
}

export interface SyncProgress {
    currentTable: string;
    tablesCompleted: number;
    totalTables: number;
    currentRecords: number;
    totalRecords: number;
    overallProgress: number;
}

export class DataSyncService {
    private logger = Logger.getInstance();

    constructor(
        private adbService: AdbService,
        private sqliteService: SqliteService,
    ) {}

    async syncDataFromDevice(
        deviceId: string,
        remoteDatabasePath: string,
        progressCallback?: (progress: SyncProgress) => void,
    ): Promise<SyncResult[]> {
        const results: SyncResult[] = [];
        let localTempDbPath: string | null = null;

        try {
            // Step 1: Pull database from device
            this.logger.info(`Pulling database from device: ${remoteDatabasePath}`);
            localTempDbPath = await this.pullDatabaseFromDevice(deviceId, remoteDatabasePath);

            // Step 2: Connect to both databases
            const remoteDb = new Database(localTempDbPath, { readonly: true });

            try {
                // Step 3: Sync each table including product_mst
                const tablesToSync = [
                    'inventory_data',
                    'stockin_data',
                    'stockout_data',
                    'product_mst',
                ];

                for (let i = 0; i < tablesToSync.length; i++) {
                    const tableName = tablesToSync[i];

                    if (progressCallback) {
                        progressCallback({
                            currentTable: tableName,
                            tablesCompleted: i,
                            totalTables: tablesToSync.length,
                            currentRecords: 0,
                            totalRecords: 0,
                            overallProgress: Math.round((i / tablesToSync.length) * 100),
                        });
                    }

                    try {
                        const result = await this.syncTable(
                            remoteDb,
                            tableName,
                            progressCallback,
                            i,
                            tablesToSync.length,
                        );
                        results.push(result);
                    } catch (error) {
                        this.logger.error(`Failed to sync table ${tableName}:`, error as Error);
                        results.push({
                            tableName,
                            recordsFound: 0,
                            recordsInserted: 0,
                            recordsUpdated: 0,
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error',
                        });
                    }
                }

                // Final progress update
                if (progressCallback) {
                    progressCallback({
                        currentTable: 'Completed',
                        tablesCompleted: tablesToSync.length,
                        totalTables: tablesToSync.length,
                        currentRecords: 0,
                        totalRecords: 0,
                        overallProgress: 100,
                    });
                }
            } finally {
                remoteDb.close();
            }
        } catch (error) {
            this.logger.error('Failed to sync data from device:', error as Error);
            throw error;
        } finally {
            // Clean up temporary database file
            if (localTempDbPath && fs.existsSync(localTempDbPath)) {
                try {
                    fs.unlinkSync(localTempDbPath);
                    this.logger.info(`Cleaned up temporary database: ${localTempDbPath}`);
                } catch (error) {
                    this.logger.warn(
                        `Failed to clean up temporary database: ${localTempDbPath}`,
                        error as Error,
                    );
                }
            }
        }

        return results;
    }

    private async pullDatabaseFromDevice(deviceId: string, remotePath: string): Promise<string> {
        // Create temporary file for the database
        const tempDir = os.tmpdir();
        const tempFileName = `kss_android_${Date.now()}_${Math.random().toString(36).substring(7)}.db`;
        const localTempPath = path.join(tempDir, tempFileName);

        try {
            // Pull database from device
            const transferResult = await this.adbService.pullFile(
                deviceId,
                remotePath,
                localTempPath,
            );

            if (!transferResult.success) {
                throw new Error(
                    `Failed to pull database from device: ${transferResult.error || transferResult.message}`,
                );
            }

            // Verify the file exists and is a valid SQLite database
            if (!fs.existsSync(localTempPath)) {
                throw new Error('Database file was not downloaded successfully');
            }

            const fileStats = fs.statSync(localTempPath);
            if (fileStats.size === 0) {
                throw new Error('Downloaded database file is empty');
            }

            // Try to open the database to verify it's valid SQLite
            try {
                const testDb = new Database(localTempPath, { readonly: true });
                testDb.close();
            } catch (error) {
                throw new Error('Downloaded file is not a valid SQLite database');
            }

            this.logger.info(`Successfully pulled database: ${fileStats.size} bytes`);
            return localTempPath;
        } catch (error) {
            // Clean up on error
            if (fs.existsSync(localTempPath)) {
                fs.unlinkSync(localTempPath);
            }
            throw error;
        }
    }

    private async syncTable(
        remoteDb: Database.Database,
        tableName: string,
        progressCallback?: (progress: SyncProgress) => void,
        currentTableIndex: number = 0,
        totalTables: number = 1,
    ): Promise<SyncResult> {
        try {
            // Check if table exists in remote database
            const tableExists = remoteDb
                .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
                .get(tableName);

            if (!tableExists) {
                return {
                    tableName,
                    recordsFound: 0,
                    recordsInserted: 0,
                    recordsUpdated: 0,
                    success: true,
                    error: 'Table not found in remote database',
                };
            }

            // Get all records from remote table
            const records = remoteDb.prepare(`SELECT * FROM ${tableName}`).all();
            this.logger.info(`Found ${records.length} records in ${tableName}`);

            if (records.length === 0) {
                return {
                    tableName,
                    recordsFound: 0,
                    recordsInserted: 0,
                    recordsUpdated: 0,
                    success: true,
                };
            }

            let inserted = 0;
            let updated = 0;

            // Process records in batches for better performance and progress updates
            const batchSize = 100;
            const totalRecords = records.length;

            for (let i = 0; i < records.length; i += batchSize) {
                const batch = records.slice(i, i + batchSize);

                // Update progress
                if (progressCallback) {
                    const currentRecords = Math.min(i + batchSize, totalRecords);
                    const tableProgress = (currentRecords / totalRecords) * (1 / totalTables);
                    const overallProgress = Math.round(
                        ((currentTableIndex + tableProgress) / totalTables) * 100,
                    );

                    progressCallback({
                        currentTable: tableName,
                        tablesCompleted: currentTableIndex,
                        totalTables: totalTables,
                        currentRecords: currentRecords,
                        totalRecords: totalRecords,
                        overallProgress: overallProgress,
                    });
                }

                // Process batch based on table type
                const batchResult = await this.processBatch(tableName, batch);
                inserted += batchResult.inserted;
                updated += batchResult.updated;
            }

            return {
                tableName,
                recordsFound: records.length,
                recordsInserted: inserted,
                recordsUpdated: updated,
                success: true,
            };
        } catch (error) {
            this.logger.error(`Error syncing table ${tableName}:`, error as Error);
            return {
                tableName,
                recordsFound: 0,
                recordsInserted: 0,
                recordsUpdated: 0,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    private async processBatch(
        tableName: string,
        records: any[],
    ): Promise<{ inserted: number; updated: number }> {
        let inserted = 0;
        let updated = 0;

        for (const record of records) {
            try {
                const result = await this.upsertRecord(tableName, record);
                if (result.inserted) {
                    inserted++;
                } else {
                    updated++;
                }
            } catch (error) {
                this.logger.error(`Failed to upsert record in ${tableName}:`, error as Error);
                // Continue with other records instead of failing the entire batch
            }
        }

        return { inserted, updated };
    }

    private async upsertRecord(tableName: string, record: any): Promise<{ inserted: boolean }> {
        switch (tableName) {
            case 'inventory_data':
                return await this.upsertInventoryRecord(record);
            case 'stockin_data':
                return await this.upsertStockinRecord(record);
            case 'stockout_data':
                return await this.upsertStockoutRecord(record);
            case 'product_mst':
                return await this.upsertProductMasterRecord(record);
            default:
                throw new Error(`Unsupported table: ${tableName}`);
        }
    }

    private async upsertProductMasterRecord(record: any): Promise<{ inserted: boolean }> {
        try {
            // Check if product exists in local database by jan_code
            const existing = await this.sqliteService.get(
                'SELECT jan_code, box_quantity FROM product WHERE jan_code = ?',
                [record.jan_code],
            );

            if (existing) {
                // Update existing product with new box_quantity from product_mst
                await this.sqliteService.run(
                    'UPDATE product SET box_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE jan_code = ?',
                    [record.box_quantity || 0, record.jan_code],
                );

                this.logger.info(
                    `Updated box_quantity for product ${record.jan_code}: ${existing.box_quantity} -> ${record.box_quantity}`,
                );
                return { inserted: false };
            } else {
                // Create new product record with data from product_mst
                await this.sqliteService.run(
                    'INSERT INTO product (jan_code, product_name, box_quantity, supplier_code) VALUES (?, ?, ?, ?)',
                    [
                        record.jan_code,
                        record.product_name || record.jan_code, // Use jan_code as fallback for product_name
                        record.box_quantity || 0,
                        record.supplier_code || '',
                    ],
                );

                this.logger.info(
                    `Created new product from product_mst: ${record.jan_code} with box_quantity: ${record.box_quantity}`,
                );
                return { inserted: true };
            }
        } catch (error) {
            this.logger.error('Failed to upsert product master record:', error as Error);
            throw error;
        }
    }

    private async upsertInventoryRecord(record: any): Promise<{ inserted: boolean }> {
        try {
            // Check if record exists based on unique combination
            const existing = await this.sqliteService.get(
                `SELECT id FROM inventory_data 
         WHERE staff_code = ? AND shop_code = ? AND shelf_number = ? AND shelf_position = ? 
         AND input_date = ? AND (jan_code = ? OR (jan_code IS NULL AND ? IS NULL))`,
                [
                    record.staff_code,
                    record.shop_code,
                    record.shelf_number,
                    record.shelf_position,
                    record.input_date,
                    record.jan_code || null,
                    record.jan_code || null,
                ],
            );

            if (existing) {
                // Update existing record
                await this.sqliteService.run(
                    `UPDATE inventory_data SET 
           input_date = ?, staff_code = ?, shop_code = ?, shelf_number = ?, shelf_position = ?,
           jan_code = ?, quantity = ?, cost = ?, price = ?, system_quantity = ?,
           quantity_discrepancy = ?, note = ?, update_date = ?, update_time = ?,
           updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
                    [
                        record.input_date,
                        record.staff_code,
                        record.shop_code,
                        record.shelf_number,
                        record.shelf_position,
                        record.jan_code || null,
                        record.quantity,
                        record.cost,
                        record.price,
                        record.system_quantity,
                        record.quantity_discrepancy,
                        record.note,
                        record.update_date || null,
                        record.update_time || null,
                        existing.id,
                    ],
                );
                return { inserted: false };
            } else {
                // Insert new record
                await this.sqliteService.run(
                    `INSERT INTO inventory_data (
           input_date, staff_code, shop_code, shelf_number, shelf_position,
           jan_code, quantity, cost, price, system_quantity,
           quantity_discrepancy, note, update_date, update_time
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        record.input_date,
                        record.staff_code,
                        record.shop_code,
                        record.shelf_number,
                        record.shelf_position,
                        record.jan_code || null,
                        record.quantity,
                        record.cost,
                        record.price,
                        record.system_quantity,
                        record.quantity_discrepancy,
                        record.note,
                        record.update_date || null,
                        record.update_time || null,
                    ],
                );
                return { inserted: true };
            }
        } catch (error) {
            this.logger.error('Failed to upsert inventory record:', error as Error);
            throw error;
        }
    }

    private async upsertStockinRecord(record: any): Promise<{ inserted: boolean }> {
        try {
            // Check if record exists based on unique combination
            const existing = await this.sqliteService.get(
                `SELECT id FROM stockin_data 
         WHERE slip_number = ? AND product_code = ? AND input_date = ? AND shop_code = ?`,
                [record.slip_number, record.product_code, record.input_date, record.shop_code],
            );

            if (existing) {
                // Update existing record
                await this.sqliteService.run(
                    `UPDATE stockin_data SET 
           input_date = ?, supplier_code = ?, supplier_name = ?, slip_number = ?, location = ?,
           shelf_no = ?, shelf_position = ?, product_code = ?, quantity = ?, staff_code = ?,
           shop_code = ?, note = ?, update_date = ?, update_time = ?, ignore_trigger = ?,
           updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
                    [
                        record.input_date,
                        record.supplier_code || null,
                        record.supplier_name || null,
                        record.slip_number,
                        record.location,
                        record.shelf_no,
                        record.shelf_position,
                        record.product_code,
                        record.quantity,
                        record.staff_code,
                        record.shop_code,
                        record.note,
                        record.update_date || null,
                        record.update_time || null,
                        record.ignore_trigger ? 1 : 0,
                        existing.id,
                    ],
                );
                return { inserted: false };
            } else {
                // Insert new record
                await this.sqliteService.run(
                    `INSERT INTO stockin_data (
           input_date, supplier_code, supplier_name, slip_number, location,
           shelf_no, shelf_position, product_code, quantity, staff_code,
           shop_code, note, update_date, update_time, ignore_trigger
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        record.input_date,
                        record.supplier_code || null,
                        record.supplier_name || null,
                        record.slip_number,
                        record.location,
                        record.shelf_no,
                        record.shelf_position,
                        record.product_code,
                        record.quantity,
                        record.staff_code,
                        record.shop_code,
                        record.note,
                        record.update_date || null,
                        record.update_time || null,
                        record.ignore_trigger ? 1 : 0,
                    ],
                );
                return { inserted: true };
            }
        } catch (error) {
            this.logger.error('Failed to upsert stockin record:', error as Error);
            throw error;
        }
    }

    private async upsertStockoutRecord(record: any): Promise<{ inserted: boolean }> {
        try {
            // Check if record exists based on unique combination
            const existing = await this.sqliteService.get(
                `SELECT id FROM stockout_data 
         WHERE slip_number = ? AND product_code = ? AND input_date = ? AND shop_code = ?`,
                [record.slip_number, record.product_code, record.input_date, record.shop_code],
            );

            if (existing) {
                // Update existing record
                await this.sqliteService.run(
                    `UPDATE stockout_data SET 
           input_date = ?, supplier_code = ?, slip_number = ?, location = ?, shelf_no = ?,
           shelf_position = ?, product_code = ?, quantity = ?, staff_code = ?, shop_code = ?,
           note = ?, update_date = ?, update_time = ?, dept_code = ?, dept_name = ?,
           ignore_trigger = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
                    [
                        record.input_date,
                        record.supplier_code,
                        record.slip_number,
                        record.location,
                        record.shelf_no,
                        record.shelf_position,
                        record.product_code,
                        record.quantity,
                        record.staff_code,
                        record.shop_code,
                        record.note,
                        record.update_date || null,
                        record.update_time || null,
                        record.dept_code,
                        record.dept_name,
                        record.ignore_trigger ? 1 : 0,
                        existing.id,
                    ],
                );
                return { inserted: false };
            } else {
                // Insert new record
                await this.sqliteService.run(
                    `INSERT INTO stockout_data (
           input_date, supplier_code, slip_number, location, shelf_no,
           shelf_position, product_code, quantity, staff_code, shop_code,
           note, update_date, update_time, dept_code, dept_name, ignore_trigger
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        record.input_date,
                        record.supplier_code,
                        record.slip_number,
                        record.location,
                        record.shelf_no,
                        record.shelf_position,
                        record.product_code,
                        record.quantity,
                        record.staff_code,
                        record.shop_code,
                        record.note,
                        record.update_date || null,
                        record.update_time || null,
                        record.dept_code,
                        record.dept_name,
                        record.ignore_trigger ? 1 : 0,
                    ],
                );
                return { inserted: true };
            }
        } catch (error) {
            this.logger.error('Failed to upsert stockout record:', error as Error);
            throw error;
        }
    }
}
