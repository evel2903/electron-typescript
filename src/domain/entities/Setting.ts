// src/domain/entities/Setting.ts
import { SettingKey } from '@/shared/constants/settings';

export interface Setting {
  key: SettingKey;
  value: string;
  updatedAt: Date;
  createdAt: Date;
}