// src/domain/usecases/GetSettingByKey.ts
import { Setting } from '../entities/Setting';
import { ISettingRepository } from '../repositories/ISettingRepository';

export class GetSettingByKeyUseCase {
  constructor(private settingRepository: ISettingRepository) {}

  async execute(key: string): Promise<Setting | null> {
    if (!key || key.trim() === '') {
      throw new Error('Setting key cannot be empty');
    }

    return await this.settingRepository.getSettingByKey(key);
  }
}