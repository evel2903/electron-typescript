// src/infrastructure/repositories/AppInfoRepository.ts
import { AppInfo } from '@/domain/entities/AppInfo';
import { IAppInfoRepository } from '@/domain/repositories/IAppInfoRepository';
import { IElectronAPI } from '@/application/interfaces/IElectronAPI';

export class AppInfoRepository implements IAppInfoRepository {
  constructor(private electronAPI?: IElectronAPI) {}

  async getAppInfo(): Promise<AppInfo> {
    return {
      name: 'Clean Architecture Electron App',
      version: '1.0.0',
      description: 'A demonstration of Clean Architecture principles in an Electron application',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
    };
  }

  async getSystemInfo(): Promise<{
    nodeVersion: string;
    chromeVersion: string;
    electronVersion: string;
  }> {
    if (this.electronAPI) {
      const versions = this.electronAPI.getVersions();
      return {
        nodeVersion: versions.node,
        chromeVersion: versions.chrome,
        electronVersion: versions.electron
      };
    }

    // Fallback for when electron API is not available
    return {
      nodeVersion: process.versions.node || 'Unknown',
      chromeVersion: process.versions.chrome || 'Unknown',
      electronVersion: process.versions.electron || 'Unknown'
    };
  }
}