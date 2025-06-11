// src/domain/repositories/ISettingRepository.ts
import { Setting } from '../entities/Setting';
import { SettingKey } from '@/shared/constants/settings';

export interface ISettingRepository {
    getSetting(key: SettingKey): Promise<Setting | null>;
    updateSetting(key: SettingKey, value: string): Promise<Setting>;
    getAllSettings(): Promise<Setting[]>;
    deleteSetting(key: SettingKey): Promise<boolean>;
    initializeDatabase(): Promise<boolean>;
}
