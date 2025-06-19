// src/infrastructure/services/SqliteService.ts - Updated with product alert fields
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { Logger } from '@/shared/utils/logger';
import { app } from 'electron';

export class SqliteService {
    private db: Database.Database | null = null;
    private logger = Logger.getInstance();
    private dbPath: string;

    constructor() {
        this.dbPath = this.resolveDatabasePath();
    }

    private resolveDatabasePath(): string {
        const isDev = process.env.NODE_ENV === 'development';
        let basePath: string;

        if (isDev) {
            basePath = path.join(__dirname, '../');
        } else {
            basePath = path.dirname(app.getPath('exe'));
        }
        console.log(`Base path resolved to: ${basePath}`);
        const dbPath = path.join(basePath, 'app.db');
        this.logger.info(`Database path resolved to: ${dbPath}`);

        return dbPath;
    }

    private getSchemaSQL(): string {
        return `
            -- Settings table
            CREATE TABLE IF NOT EXISTS sys_setting (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Product table
            CREATE TABLE IF NOT EXISTS product (
                jan_code TEXT PRIMARY KEY,
                product_name TEXT NOT NULL,
                box_quantity INTEGER DEFAULT 0,
                supplier_code TEXT,
                stock_in_alert INTEGER DEFAULT 0,
                stock_out_alert INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Location table
            CREATE TABLE IF NOT EXISTS location (
                shop_code TEXT PRIMARY KEY,
                shop_name TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Staff table
            CREATE TABLE IF NOT EXISTS staff (
                staff_code TEXT PRIMARY KEY,
                staff_name TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Supplier table
            CREATE TABLE IF NOT EXISTS supplier (
                supplier_code TEXT PRIMARY KEY,
                supplier_name TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            
            -- Inventory Data table
            CREATE TABLE IF NOT EXISTS inventory_data (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, input_date TEXT, staff_code TEXT NOT NULL, shop_code TEXT NOT NULL, shelf_number INTEGER NOT NULL, shelf_position INTEGER NOT NULL, jan_code TEXT, quantity INTEGER NOT NULL, cost REAL NOT NULL, price INTEGER NOT NULL, system_quantity INTEGER NOT NULL, quantity_discrepancy INTEGER NOT NULL, note TEXT NOT NULL, update_date TEXT, update_time TEXT
            ,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
            

            -- Stockin Data table
            CREATE TABLE IF NOT EXISTS stockin_data (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, input_date TEXT NOT NULL, supplier_code TEXT, supplier_name TEXT, slip_number TEXT NOT NULL, location TEXT NOT NULL, shelf_no INTEGER NOT NULL, shelf_position INTEGER NOT NULL, product_code TEXT NOT NULL, quantity INTEGER NOT NULL, staff_code TEXT NOT NULL, shop_code TEXT NOT NULL, note TEXT NOT NULL, update_date TEXT, update_time TEXT, ignore_trigger INTEGER NOT NULL
            ,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);

            -- Stockout Data table
            CREATE TABLE IF NOT EXISTS stockout_data (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, input_date TEXT NOT NULL, supplier_code TEXT NOT NULL, slip_number TEXT NOT NULL, location TEXT NOT NULL, shelf_no INTEGER NOT NULL, shelf_position INTEGER NOT NULL, product_code TEXT NOT NULL, quantity INTEGER NOT NULL, staff_code TEXT NOT NULL, shop_code TEXT NOT NULL, note TEXT NOT NULL, update_date TEXT, update_time TEXT, dept_code TEXT NOT NULL, dept_name TEXT NOT NULL, ignore_trigger INTEGER NOT NULL
                ,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Create triggers for updated_at
            CREATE TRIGGER IF NOT EXISTS sys_setting_updated_at 
            AFTER UPDATE ON sys_setting
            BEGIN
                UPDATE sys_setting SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
            END;

            CREATE TRIGGER IF NOT EXISTS product_updated_at 
            AFTER UPDATE ON product
            BEGIN
                UPDATE product SET updated_at = CURRENT_TIMESTAMP WHERE jan_code = NEW.jan_code;
            END;

            CREATE TRIGGER IF NOT EXISTS location_updated_at 
            AFTER UPDATE ON location
            BEGIN
                UPDATE location SET updated_at = CURRENT_TIMESTAMP WHERE shop_code = NEW.shop_code;
            END;

            CREATE TRIGGER IF NOT EXISTS staff_updated_at 
            AFTER UPDATE ON staff
            BEGIN
                UPDATE staff SET updated_at = CURRENT_TIMESTAMP WHERE staff_code = NEW.staff_code;
            END;

            CREATE TRIGGER IF NOT EXISTS supplier_updated_at 
            AFTER UPDATE ON supplier
            BEGIN
                UPDATE supplier SET updated_at = CURRENT_TIMESTAMP WHERE supplier_code = NEW.supplier_code;
            END;

            CREATE TRIGGER IF NOT EXISTS inventory_data_updated_at 
            AFTER UPDATE ON inventory_data
            BEGIN
                UPDATE inventory_data SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END;

            CREATE TRIGGER IF NOT EXISTS stockin_data_updated_at 
            AFTER UPDATE ON stockin_data
            BEGIN
                UPDATE stockin_data SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END;

            CREATE TRIGGER IF NOT EXISTS stockout_data_updated_at 
            AFTER UPDATE ON stockout_data
            BEGIN
                UPDATE stockout_data SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END;
        `;
    }

    private async initializeDatabase(db: Database.Database): Promise<void> {
        try {
            // Create schema
            db.exec(this.getSchemaSQL());

            // Add any initial required settings
            db.prepare(`
                INSERT OR IGNORE INTO sys_setting (key, value) 
                VALUES ('database_version', '1.0.0')
            `).run();

            this.logger.info('Database schema initialized successfully');
        } catch (error) {
            this.logger.error('Error initializing database schema:', error as Error);
            throw error;
        }
    }

    private createTemplateDatabase(templatePath: string): void {
        try {
            // Remove existing template if it exists
            if (fs.existsSync(templatePath)) {
                fs.unlinkSync(templatePath);
            }

            const db = new Database(templatePath);
            this.initializeDatabase(db);
            db.close();
            
            this.logger.info('Template database created successfully at:', templatePath);
        } catch (error) {
            this.logger.error('Error creating template database:', error as Error);
            throw error;
        }
    }

    private async copyTemplateDatabaseIfNeeded(): Promise<void> {
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev) return;

        try {
            // Check if database already exists
            if (fs.existsSync(this.dbPath)) {
                this.logger.info('Database already exists, skipping template copy');
                return;
            }

            // Get the template database path from the app resources
            const templatePath = path.join(process.resourcesPath, 'app.db');
            
            if (!fs.existsSync(templatePath)) {
                this.logger.info('No template database found, creating new database');
                this.createTemplateDatabase(this.dbPath);
                return;
            }

            // Copy template database to installation directory
            fs.copyFileSync(templatePath, this.dbPath);
            this.logger.info('Template database copied successfully');
        } catch (error) {
            this.logger.error('Error copying template database:', error as Error);
            throw error;
        }
    }

    async connect(): Promise<boolean> {
        try {
            // Ensure the directory exists
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // Copy template database if needed
            await this.copyTemplateDatabaseIfNeeded();

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
            if (!this.db) {
                throw new Error('Database not connected');
            }

            // 1. Initialize schema first (create tables if missing)
            await this.initializeDatabase(this.db);

            // 2. Then run migrations
            await this.runMigrations();

            return true;
        } catch (error) {
            this.logger.error('Failed to initialize schema:', error as Error);
            return false;
        }
    }

    private async runMigrations(): Promise<void> {
        try {
            // Create migrations table if it doesn't exist
            await this.run(`
                CREATE TABLE IF NOT EXISTS migrations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    migration_name TEXT UNIQUE NOT NULL,
                    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Migration 1: Add alert fields to product table
            const migrationName = 'add_product_alert_fields';
            const existingMigration = await this.get(
                'SELECT migration_name FROM migrations WHERE migration_name = ?',
                [migrationName],
            );

            if (!existingMigration) {
                // Check if product table exists and if alert fields are missing
                const tableInfo = await this.all(`PRAGMA table_info(product)`);
                const hasStockInAlert = tableInfo.some((col: any) => col.name === 'stock_in_alert');
                const hasStockOutAlert = tableInfo.some(
                    (col: any) => col.name === 'stock_out_alert',
                );

                if (!hasStockInAlert || !hasStockOutAlert) {
                    this.logger.info('Running migration: add_product_alert_fields');

                    if (!hasStockInAlert) {
                        await this.run(
                            `ALTER TABLE product ADD COLUMN stock_in_alert INTEGER DEFAULT 0`,
                        );
                    }

                    if (!hasStockOutAlert) {
                        await this.run(
                            `ALTER TABLE product ADD COLUMN stock_out_alert INTEGER DEFAULT 0`,
                        );
                    }

                    // Record the migration
                    await this.run('INSERT INTO migrations (migration_name) VALUES (?)', [
                        migrationName,
                    ]);

                    this.logger.info('Migration completed: add_product_alert_fields');
                }
            }
        } catch (error) {
            this.logger.error('Migration failed:', error as Error);
            throw error;
        }
    }

    getDatabasePath(): string {
        return this.dbPath;
    }
}
