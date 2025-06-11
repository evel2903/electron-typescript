// src/domain/usecases/UpdateSetting.ts
import { Setting } from '../entities/Setting';
import { ISettingRepository } from '../repositories/ISettingRepository';
import { SettingKey, SETTING_DEFINITIONS } from '@/shared/constants/settings';

export class UpdateSettingUseCase {
    constructor(private settingRepository: ISettingRepository) {}

    async execute(key: SettingKey, value: string): Promise<Setting> {
        // Validate the setting key exists in definitions
        if (!SETTING_DEFINITIONS[key]) {
            throw new Error(`Invalid setting key: ${key}`);
        }

        const definition = SETTING_DEFINITIONS[key];

        // Validate required settings
        if (definition.required && (!value || value.trim() === '')) {
            throw new Error(`Setting '${definition.label}' is required and cannot be empty`);
        }

        // For directory paths, we could add additional validation here
        if (definition.type === 'directory' && value) {
            // Basic path validation - could be enhanced with actual file system checks
            if (value.includes('<') || value.includes('>') || value.includes('|')) {
                throw new Error(`Invalid directory path: ${value}`);
            }
        }

        return await this.settingRepository.updateSetting(key, value);
    }
}
