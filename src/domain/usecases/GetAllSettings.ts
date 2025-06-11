// src/domain/usecases/GetAllSettings.ts
import { Setting } from '../entities/Setting';
import { ISettingRepository } from '../repositories/ISettingRepository';
import { SETTING_KEYS, SETTING_DEFINITIONS, SettingKey } from '@/shared/constants/settings';

export class GetAllSettingsUseCase {
    constructor(private settingRepository: ISettingRepository) {}

    async execute(): Promise<Setting[]> {
        const existingSettings = await this.settingRepository.getAllSettings();
        const settingsMap = new Map(existingSettings.map((setting) => [setting.key, setting]));

        const allSettings: Setting[] = [];

        // Ensure all defined settings exist, creating defaults where necessary
        for (const key of Object.values(SETTING_KEYS) as SettingKey[]) {
            const existingSetting = settingsMap.get(key);

            if (existingSetting) {
                allSettings.push(existingSetting);
            } else {
                const definition = SETTING_DEFINITIONS[key];
                if (definition?.defaultValue !== undefined && definition.defaultValue !== '') {
                    // Create setting with default value
                    const newSetting = await this.settingRepository.updateSetting(
                        key,
                        definition.defaultValue,
                    );
                    allSettings.push(newSetting);
                } else {
                    // Create empty setting placeholder
                    const now = new Date();
                    allSettings.push({
                        key,
                        value: '',
                        createdAt: now,
                        updatedAt: now,
                    });
                }
            }
        }

        return allSettings;
    }
}
