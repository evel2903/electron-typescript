// src/infrastructure/repositories/SettingRepository.ts
import { Setting } from '@/domain/entities/Setting';
import { ISettingRepository } from '@/domain/repositories/ISettingRepository';
import { SettingKey } from '@/shared/constants/settings';

export class SettingRepository implements ISettingRepository {
  private get electronAPI() {
    if (!window.electronAPI?.settings) {
      throw new Error('Electron Settings API is not available. Please ensure the application is running in Electron environment.');
    }
    return window.electronAPI.settings;
  }

  async initializeDatabase(): Promise<boolean> {
    return await this.electronAPI.initialize();
  }

  async getSetting(key: SettingKey): Promise<Setting | null> {
    return await this.electronAPI.getSetting(key);
  }

  async updateSetting(key: SettingKey, value: string): Promise<Setting> {
    return await this.electronAPI.updateSetting(key, value);
  }

  async getAllSettings(): Promise<Setting[]> {
    return await this.electronAPI.getAllSettings();
  }

  async deleteSetting(key: SettingKey): Promise<boolean> {
    return await this.electronAPI.deleteSetting(key);
  }
}