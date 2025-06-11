// src/infrastructure/services/SqliteService.ts - Updated with data import tables
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
      return result as T || null;
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
      return result as T[] || [];
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

      // Product table
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

      // Location table
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

      // Staff table
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

      // Supplier table
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

      // Create indexes for better performance
      await this.run(`CREATE INDEX IF NOT EXISTS idx_product_supplier_code ON product(supplier_code)`);
      await this.run(`CREATE INDEX IF NOT EXISTS idx_product_name ON product(product_name)`);
      await this.run(`CREATE INDEX IF NOT EXISTS idx_location_name ON location(shop_name)`);
      await this.run(`CREATE INDEX IF NOT EXISTS idx_staff_name ON staff(staff_name)`);
      await this.run(`CREATE INDEX IF NOT EXISTS idx_supplier_name ON supplier(supplier_name)`);

      this.logger.info('Database schema initialized successfully');
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