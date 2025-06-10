// src/infrastructure/repositories/SettingRepository.ts
import { Setting } from '@/domain/entities/Setting';
import { ISettingRepository } from '@/domain/repositories/ISettingRepository';

export class SettingRepository implements ISettingRepository {
  private get electronAPI() {
    if (!window.electronAPI?.database) {
      throw new Error('Electron Database API is not available. Please ensure the application is running in Electron environment.');
    }
    return window.electronAPI.database;
  }

  async getAllSettings(): Promise<Setting[]> {
    return await this.electronAPI.getAllSettings();
  }

  async getSettingByKey(key: string): Promise<Setting | null> {
    return await this.electronAPI.getSettingByKey(key);
  }

  async createSetting(key: string, value: string): Promise<Setting> {
    return await this.electronAPI.createSetting(key, value);
  }

  async updateSetting(key: string, value: string): Promise<Setting> {
    return await this.electronAPI.updateSetting(key, value);
  }

  async upsertSetting(key: string, value: string): Promise<Setting> {
    return await this.electronAPI.upsertSetting(key, value);
  }

  async deleteSetting(key: string): Promise<boolean> {
    return await this.electronAPI.deleteSetting(key);
  }

  async initializeDatabase(): Promise<void> {
    return await this.electronAPI.initializeDatabase();
  }
}