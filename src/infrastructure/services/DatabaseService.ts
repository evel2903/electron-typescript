// src/infrastructure/services/DatabaseService.ts
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: Database.Database | null = null;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize(): Promise<void> {
    try {
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'app_database.sqlite');
      
      // Ensure the directory exists
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      console.log(`Initializing database at: ${dbPath}`);
      
      this.db = new Database(dbPath);
      
      // Enable WAL mode for better performance
      this.db.pragma('journal_mode = WAL');
      
      // Create tables
      await this.createTables();
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Create sys_setting table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sys_setting (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create trigger to automatically update updated_at
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_sys_setting_timestamp 
      AFTER UPDATE ON sys_setting
      BEGIN
        UPDATE sys_setting SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
      END
    `);

    console.log('Database tables created successfully');
  }

  getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('Database connection closed');
    }
  }
}