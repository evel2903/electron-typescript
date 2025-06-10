// src/shared/constants/settings.ts
export const SETTING_KEYS = {
  FILE_IMPORT_PATH: 'FILE_IMPORT_PATH',
} as const;

export type SettingKey = typeof SETTING_KEYS[keyof typeof SETTING_KEYS];

export const SETTING_DESCRIPTIONS: Record<SettingKey, string> = {
  [SETTING_KEYS.FILE_IMPORT_PATH]: 'Default path for importing files',
} as const;

export const SETTING_LABELS: Record<SettingKey, string> = {
  [SETTING_KEYS.FILE_IMPORT_PATH]: 'File Import Path',
} as const;