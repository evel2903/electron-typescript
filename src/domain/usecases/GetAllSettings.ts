// src/domain/usecases/GetAllSettings.ts
import { Setting } from '../entities/Setting';
import { ISettingRepository } from '../repositories/ISettingRepository';

export class GetAllSettingsUseCase {
  constructor(private settingRepository: ISettingRepository) {}

  async execute(): Promise<Setting[]> {
    return await this.settingRepository.getAllSettings();
  }
}