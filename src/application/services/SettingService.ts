// src/application/services/SettingService.ts
import { GetAllSettingsUseCase } from '@/domain/usecases/GetAllSettings';
import { GetSettingByKeyUseCase } from '@/domain/usecases/GetSettingByKey';
import { UpdateSettingUseCase } from '@/domain/usecases/UpdateSetting';
import { ISettingRepository } from '@/domain/repositories/ISettingRepository';
import { Setting } from '@/domain/entities/Setting';

export class SettingService {
  private getAllSettingsUseCase: GetAllSettingsUseCase;
  private getSettingByKeyUseCase: GetSettingByKeyUseCase;
  private updateSettingUseCase: UpdateSettingUseCase;

  constructor(settingRepository: ISettingRepository) {
    this.getAllSettingsUseCase = new GetAllSettingsUseCase(settingRepository);
    this.getSettingByKeyUseCase = new GetSettingByKeyUseCase(settingRepository);
    this.updateSettingUseCase = new UpdateSettingUseCase(settingRepository);
  }

  async getAllSettings(): Promise<Setting[]> {
    return await this.getAllSettingsUseCase.execute();
  }

  async getSettingByKey(key: string): Promise<Setting | null> {
    return await this.getSettingByKeyUseCase.execute(key);
  }

  async updateSetting(key: string, value: string): Promise<Setting> {
    return await this.updateSettingUseCase.execute(key, value);
  }
}