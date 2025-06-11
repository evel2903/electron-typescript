// src/infrastructure/services/SqliteService.ts - Updated with new tables
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { Logger } from '@/shared/utils/logger';

export class SqliteService {
    private db: Database.Database | null = null;
    private logger = Logger.getInstance();
    private dbPath: string;

    constructor() {
        // Database file at the same level as src folder
        this.dbPath = this.resolveDatabasePath();
    }

    private resolveDatabasePath(): string {
        const isDev = process.env.NODE_ENV === 'development';
        let basePath: string;

        if (isDev) {
            // In development, place database at project root level
            basePath = path.join(__dirname, '../');
        } else {
            // In production, place database in application directory
            basePath = path.dirname(process.execPath);
        }
        console.log(`Base path resolved to: ${basePath}`);
        const dbPath = path.join(basePath, 'app.db');
        this.logger.info(`Database path resolved to: ${dbPath}`);

        return dbPath;
    }

    async connect(): Promise<boolean> {
        try {
            // Ensure the directory exists
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            this.db = new Database(this.dbPath);
            this.logger.info('Connected to SQLite database successfully');
            return true;
        } catch (error) {
            this.logger.error('Failed to connect to database:', error as Error);
            return false;
        }
    }

    async disconnect(): Promise<void> {
        try {
            if (this.db) {
                this.db.close();
                this.logger.info('Database connection closed');
                this.db = null;
            }
        } catch (error) {
            this.logger.error('Error closing database:', error as Error);
            throw error;
        }
    }

    async run(sql: string, params: any[] = []): Promise<void> {
        if (!this.db) {
            throw new Error('Database not connected');
        }

        try {
            const stmt = this.db.prepare(sql);
            stmt.run(...params);
        } catch (error) {
            this.logger.error('Error executing SQL:', error as Error);
            throw error;
        }
    }

    async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
        if (!this.db) {
            throw new Error('Database not connected');
        }

        try {
            const stmt = this.db.prepare(sql);
            const result = stmt.get(...params);
            return (result as T) || null;
        } catch (error) {
            this.logger.error('Error executing SQL query:', error as Error);
            throw error;
        }
    }

    async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        if (!this.db) {
            throw new Error('Database not connected');
        }

        try {
            const stmt = this.db.prepare(sql);
            const result = stmt.all(...params);
            return (result as T[]) || [];
        } catch (error) {
            this.logger.error('Error executing SQL query:', error as Error);
            throw error;
        }
    }

    async initializeSchema(): Promise<boolean> {
        try {
            // Settings table (existing)
            await this.run(`
        CREATE TABLE IF NOT EXISTS sys_setting (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

            // Create trigger to update the updated_at timestamp for settings
            await this.run(`
        CREATE TRIGGER IF NOT EXISTS sys_setting_updated_at 
        AFTER UPDATE ON sys_setting
        BEGIN
          UPDATE sys_setting SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
        END
      `);

            // Product table (existing)
            await this.run(`
        CREATE TABLE IF NOT EXISTS product (
          jan_code TEXT PRIMARY KEY,
          product_name TEXT NOT NULL,
          box_quantity INTEGER DEFAULT 0,
          supplier_code TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

            // Create trigger to update the updated_at timestamp for products
            await this.run(`
        CREATE TRIGGER IF NOT EXISTS product_updated_at 
        AFTER UPDATE ON product
        BEGIN
          UPDATE product SET updated_at = CURRENT_TIMESTAMP WHERE jan_code = NEW.jan_code;
        END
      `);

            // Location table (existing)
            await this.run(`
        CREATE TABLE IF NOT EXISTS location (
          shop_code TEXT PRIMARY KEY,
          shop_name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

            // Create trigger to update the updated_at timestamp for locations
            await this.run(`
        CREATE TRIGGER IF NOT EXISTS location_updated_at 
        AFTER UPDATE ON location
        BEGIN
          UPDATE location SET updated_at = CURRENT_TIMESTAMP WHERE shop_code = NEW.shop_code;
        END
      `);

            // Staff table (existing)
            await this.run(`
        CREATE TABLE IF NOT EXISTS staff (
          staff_code TEXT PRIMARY KEY,
          staff_name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

            // Create trigger to update the updated_at timestamp for staff
            await this.run(`
        CREATE TRIGGER IF NOT EXISTS staff_updated_at 
        AFTER UPDATE ON staff
        BEGIN
          UPDATE staff SET updated_at = CURRENT_TIMESTAMP WHERE staff_code = NEW.staff_code;
        END
      `);

            // Supplier table (existing)
            await this.run(`
        CREATE TABLE IF NOT EXISTS supplier (
          supplier_code TEXT PRIMARY KEY,
          supplier_name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

            // Create trigger to update the updated_at timestamp for suppliers
            await this.run(`
        CREATE TRIGGER IF NOT EXISTS supplier_updated_at 
        AFTER UPDATE ON supplier
        BEGIN
          UPDATE supplier SET updated_at = CURRENT_TIMESTAMP WHERE supplier_code = NEW.supplier_code;
        END
      `);

            // NEW: Inventory Data table
            await this.run(`
        CREATE TABLE IF NOT EXISTS inventory_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          input_date TEXT,
          staff_code TEXT NOT NULL,
          shop_code TEXT NOT NULL,
          shelf_number INTEGER NOT NULL,
          shelf_position INTEGER NOT NULL,
          jan_code TEXT,
          quantity INTEGER NOT NULL,
          cost REAL NOT NULL,
          price INTEGER NOT NULL,
          system_quantity INTEGER NOT NULL,
          quantity_discrepancy INTEGER NOT NULL,
          note TEXT NOT NULL,
          update_date TEXT,
          update_time TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

            // Create trigger to update the updated_at timestamp for inventory_data
            await this.run(`
        CREATE TRIGGER IF NOT EXISTS inventory_data_updated_at 
        AFTER UPDATE ON inventory_data
        BEGIN
          UPDATE inventory_data SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `);

            // NEW: Stockin Data table
            await this.run(`
        CREATE TABLE IF NOT EXISTS stockin_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          input_date TEXT NOT NULL,
          supplier_code TEXT,
          supplier_name TEXT,
          slip_number TEXT NOT NULL,
          location TEXT NOT NULL,
          shelf_no INTEGER NOT NULL,
          shelf_position INTEGER NOT NULL,
          product_code TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          staff_code TEXT NOT NULL,
          shop_code TEXT NOT NULL,
          note TEXT NOT NULL,
          update_date TEXT,
          update_time TEXT,
          ignore_trigger INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

            // Create trigger to update the updated_at timestamp for stockin_data
            await this.run(`
        CREATE TRIGGER IF NOT EXISTS stockin_data_updated_at 
        AFTER UPDATE ON stockin_data
        BEGIN
          UPDATE stockin_data SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `);

            // NEW: Stockout Data table
            await this.run(`
        CREATE TABLE IF NOT EXISTS stockout_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          input_date TEXT NOT NULL,
          supplier_code TEXT NOT NULL,
          slip_number TEXT NOT NULL,
          location TEXT NOT NULL,
          shelf_no INTEGER NOT NULL,
          shelf_position INTEGER NOT NULL,
          product_code TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          staff_code TEXT NOT NULL,
          shop_code TEXT NOT NULL,
          note TEXT NOT NULL,
          update_date TEXT,
          update_time TEXT,
          dept_code TEXT NOT NULL,
          dept_name TEXT NOT NULL,
          ignore_trigger INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

            // Create trigger to update the updated_at timestamp for stockout_data
            await this.run(`
        CREATE TRIGGER IF NOT EXISTS stockout_data_updated_at 
        AFTER UPDATE ON stockout_data
        BEGIN
          UPDATE stockout_data SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `);

            // Create indexes for better performance on existing tables
            await this.run(
                `CREATE INDEX IF NOT EXISTS idx_product_supplier_code ON product(supplier_code)`,
            );
            await this.run(`CREATE INDEX IF NOT EXISTS idx_product_name ON product(product_name)`);
            await this.run(`CREATE INDEX IF NOT EXISTS idx_location_name ON location(shop_name)`);
            await this.run(`CREATE INDEX IF NOT EXISTS idx_staff_name ON staff(staff_name)`);
            await this.run(
                `CREATE INDEX IF NOT EXISTS idx_supplier_name ON supplier(supplier_name)`,
            );

            // Create indexes for new tables
            await this.run(
                `CREATE INDEX IF NOT EXISTS idx_inventory_staff_shop ON inventory_data(staff_code, shop_code)`,
            );
            await this.run(
                `CREATE INDEX IF NOT EXISTS idx_inventory_shelf ON inventory_data(shelf_number, shelf_position)`,
            );
            await this.run(
                `CREATE INDEX IF NOT EXISTS idx_inventory_jan_code ON inventory_data(jan_code)`,
            );
            await this.run(
                `CREATE INDEX IF NOT EXISTS idx_inventory_input_date ON inventory_data(input_date)`,
            );

            await this.run(
                `CREATE INDEX IF NOT EXISTS idx_stockin_slip_product ON stockin_data(slip_number, product_code)`,
            );
            await this.run(
                `CREATE INDEX IF NOT EXISTS idx_stockin_input_date ON stockin_data(input_date)`,
            );
            await this.run(
                `CREATE INDEX IF NOT EXISTS idx_stockin_staff_shop ON stockin_data(staff_code, shop_code)`,
            );
            await this.run(
                `CREATE INDEX IF NOT EXISTS idx_stockin_supplier ON stockin_data(supplier_code)`,
            );

            await this.run(
                `CREATE INDEX IF NOT EXISTS idx_stockout_slip_product ON stockout_data(slip_number, product_code)`,
            );
            await this.run(
                `CREATE INDEX IF NOT EXISTS idx_stockout_input_date ON stockout_data(input_date)`,
            );
            await this.run(
                `CREATE INDEX IF NOT EXISTS idx_stockout_staff_shop ON stockout_data(staff_code, shop_code)`,
            );
            await this.run(
                `CREATE INDEX IF NOT EXISTS idx_stockout_dept ON stockout_data(dept_code)`,
            );

            this.logger.info('Database schema initialized successfully with new tables');
            return true;
        } catch (error) {
            this.logger.error('Failed to initialize database schema:', error as Error);
            return false;
        }
    }

    getDatabasePath(): string {
        return this.dbPath;
    }
}
