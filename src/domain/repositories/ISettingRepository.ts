// src/domain/repositories/ISettingRepository.ts
import { Setting } from '../entities/Setting';

export interface ISettingRepository {
  getAllSettings(): Promise<Setting[]>;
  getSettingByKey(key: string): Promise<Setting | null>;
  createSetting(key: string, value: string): Promise<Setting>;
  updateSetting(key: string, value: string): Promise<Setting>;
  upsertSetting(key: string, value: string): Promise<Setting>;
  deleteSetting(key: string): Promise<boolean>;
  initializeDatabase(): Promise<void>;
}