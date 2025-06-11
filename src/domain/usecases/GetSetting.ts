// src/domain/usecases/GetSetting.ts
import { Setting } from '../entities/Setting';
import { ISettingRepository } from '../repositories/ISettingRepository';
import { SettingKey, SETTING_DEFINITIONS } from '@/shared/constants/settings';

export class GetSettingUseCase {
    constructor(private settingRepository: ISettingRepository) {}

    async execute(key: SettingKey): Promise<Setting | null> {
        const setting = await this.settingRepository.getSetting(key);

        // If setting doesn't exist and has a default value, create it
        if (!setting) {
            const definition = SETTING_DEFINITIONS[key];
            if (definition?.defaultValue !== undefined && definition.defaultValue !== '') {
                return await this.settingRepository.updateSetting(key, definition.defaultValue);
            }
        }

        return setting;
    }
}
