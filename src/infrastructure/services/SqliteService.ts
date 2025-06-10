// src/infrastructure/services/SqliteService.ts
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
      basePath = path.join(__dirname, '../../');
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
      await this.run(`
        CREATE TABLE IF NOT EXISTS sys_setting (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create trigger to update the updated_at timestamp
      await this.run(`
        CREATE TRIGGER IF NOT EXISTS sys_setting_updated_at 
        AFTER UPDATE ON sys_setting
        BEGIN
          UPDATE sys_setting SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
        END
      `);

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