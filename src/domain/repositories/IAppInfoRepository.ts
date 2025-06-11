// src/domain/repositories/IAppInfoRepository.ts
import { AppInfo } from '../entities/AppInfo';

export interface IAppInfoRepository {
    getAppInfo(): Promise<AppInfo>;
    getSystemInfo(): Promise<{
        nodeVersion: string;
        chromeVersion: string;
        electronVersion: string;
    }>;
}
