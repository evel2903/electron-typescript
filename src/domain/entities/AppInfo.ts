// src/domain/entities/AppInfo.ts
export interface AppInfo {
  name: string;
  version: string;
  description: string;
  environment: 'development' | 'production';
}