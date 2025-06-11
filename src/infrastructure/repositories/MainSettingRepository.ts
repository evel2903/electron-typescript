// src/infrastructure/repositories/MainSettingRepository.ts
import { Setting } from '@/domain/entities/Setting';
import { ISettingRepository } from '@/domain/repositories/ISettingRepository';
import { SettingKey } from '@/shared/constants/settings';
import { SqliteService } from '../services/SqliteService';
import { Logger } from '@/shared/utils/logger';

interface DatabaseSetting {
    key: string;
    value: string;
    created_at: string;
    updated_at: string;
}

export class MainSettingRepository implements ISettingRepository {
    private logger = Logger.getInstance();

    constructor(private sqliteService: SqliteService) {}

    async initializeDatabase(): Promise<boolean> {
        try {
            const connected = await this.sqliteService.connect();
            if (!connected) {
                return false;
            }

            return await this.sqliteService.initializeSchema();
        } catch (error) {
            this.logger.error('Failed to initialize settings database:', error as Error);
            return false;
        }
    }

    async getSetting(key: SettingKey): Promise<Setting | null> {
        try {
            const row = await this.sqliteService.get<DatabaseSetting>(
                'SELECT * FROM sys_setting WHERE key = ?',
                [key],
            );

            if (!row) {
                return null;
            }

            return this.mapDatabaseSettingToEntity(row);
        } catch (error) {
            this.logger.error(`Failed to get setting ${key}:`, error as Error);
            return null;
        }
    }

    async updateSetting(key: SettingKey, value: string): Promise<Setting> {
        try {
            // Check if setting exists
            const existingSetting = await this.getSetting(key);

            if (existingSetting) {
                // Update existing setting
                await this.sqliteService.run(
                    'UPDATE sys_setting SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
                    [value, key],
                );
            } else {
                // Insert new setting
                await this.sqliteService.run('INSERT INTO sys_setting (key, value) VALUES (?, ?)', [
                    key,
                    value,
                ]);
            }

            // Return the updated setting
            const updatedSetting = await this.getSetting(key);
            if (!updatedSetting) {
                throw new Error(`Failed to retrieve updated setting: ${key}`);
            }

            this.logger.info(`Setting ${key} updated successfully`);
            return updatedSetting;
        } catch (error) {
            this.logger.error(`Failed to update setting ${key}:`, error as Error);
            throw error;
        }
    }

    async getAllSettings(): Promise<Setting[]> {
        try {
            const rows = await this.sqliteService.all<DatabaseSetting>(
                'SELECT * FROM sys_setting ORDER BY key',
            );

            return rows.map((row) => this.mapDatabaseSettingToEntity(row));
        } catch (error) {
            this.logger.error('Failed to get all settings:', error as Error);
            return [];
        }
    }

    async deleteSetting(key: SettingKey): Promise<boolean> {
        try {
            await this.sqliteService.run('DELETE FROM sys_setting WHERE key = ?', [key]);

            this.logger.info(`Setting ${key} deleted successfully`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to delete setting ${key}:`, error as Error);
            return false;
        }
    }

    private mapDatabaseSettingToEntity(dbSetting: DatabaseSetting): Setting {
        return {
            key: dbSetting.key as SettingKey,
            value: dbSetting.value,
            createdAt: new Date(dbSetting.created_at),
            updatedAt: new Date(dbSetting.updated_at),
        };
    }
}
