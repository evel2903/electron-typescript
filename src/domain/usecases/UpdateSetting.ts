// src/domain/usecases/UpdateSetting.ts
import { Setting } from '../entities/Setting';
import { ISettingRepository } from '../repositories/ISettingRepository';

export class UpdateSettingUseCase {
  constructor(private settingRepository: ISettingRepository) {}

  async execute(key: string, value: string): Promise<Setting> {
    if (!key || key.trim() === '') {
      throw new Error('Setting key cannot be empty');
    }

    if (value === null || value === undefined) {
      throw new Error('Setting value cannot be null or undefined');
    }

    // Use upsert to handle both insert and update cases
    return await this.settingRepository.upsertSetting(key, value);
  }
}