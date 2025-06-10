// src/shared/constants/settings.ts
export const SETTING_KEYS = {
  FILE_IMPORT_PATH: 'FILE_IMPORT_PATH',
} as const;

export type SettingKey = typeof SETTING_KEYS[keyof typeof SETTING_KEYS];

export const SETTING_DEFINITIONS = {
  [SETTING_KEYS.FILE_IMPORT_PATH]: {
    key: SETTING_KEYS.FILE_IMPORT_PATH,
    label: 'Default File Import Path',
    description: 'The default directory for importing files from connected devices',
    type: 'directory' as const,
    defaultValue: '',
    required: false,
  },
} as const;

export type SettingDefinition = typeof SETTING_DEFINITIONS[keyof typeof SETTING_DEFINITIONS];