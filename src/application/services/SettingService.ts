// src/application/services/SettingService.ts
import { GetSettingUseCase } from '@/domain/usecases/GetSetting';
import { UpdateSettingUseCase } from '@/domain/usecases/UpdateSetting';
import { GetAllSettingsUseCase } from '@/domain/usecases/GetAllSettings';
import { ISettingRepository } from '@/domain/repositories/ISettingRepository';
import { Setting } from '@/domain/entities/Setting';
import { SettingKey } from '@/shared/constants/settings';

export class SettingService {
    private getSettingUseCase: GetSettingUseCase;
    private updateSettingUseCase: UpdateSettingUseCase;
    private getAllSettingsUseCase: GetAllSettingsUseCase;

    constructor(settingRepository: ISettingRepository) {
        this.getSettingUseCase = new GetSettingUseCase(settingRepository);
        this.updateSettingUseCase = new UpdateSettingUseCase(settingRepository);
        this.getAllSettingsUseCase = new GetAllSettingsUseCase(settingRepository);
    }

    async getSetting(key: SettingKey): Promise<Setting | null> {
        return await this.getSettingUseCase.execute(key);
    }

    async updateSetting(key: SettingKey, value: string): Promise<Setting> {
        return await this.updateSettingUseCase.execute(key, value);
    }

    async getAllSettings(): Promise<Setting[]> {
        return await this.getAllSettingsUseCase.execute();
    }

    async getSettingValue(key: SettingKey): Promise<string> {
        const setting = await this.getSetting(key);
        return setting?.value || '';
    }
}
