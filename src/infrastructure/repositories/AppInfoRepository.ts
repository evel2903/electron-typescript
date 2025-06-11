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
            description:
                'A demonstration of Clean Architecture principles in an Electron application',
            environment: this.getEnvironment(),
        };
    }

    async getSystemInfo(): Promise<{
        nodeVersion: string;
        chromeVersion: string;
        electronVersion: string;
    }> {
        // Always use the electronAPI for system information
        if (this.electronAPI) {
            const versions = this.electronAPI.getVersions();
            return {
                nodeVersion: versions.node,
                chromeVersion: versions.chrome,
                electronVersion: versions.electron,
            };
        }

        // Direct access to window.electronAPI as fallback
        if (window.electronAPI && window.electronAPI.getVersions) {
            const versions = window.electronAPI.getVersions();
            return {
                nodeVersion: versions.node,
                chromeVersion: versions.chrome,
                electronVersion: versions.electron,
            };
        }

        // Final fallback with unknown values
        return {
            nodeVersion: 'Unknown',
            chromeVersion: 'Unknown',
            electronVersion: 'Unknown',
        };
    }

    private getEnvironment(): 'development' | 'production' {
        // Check if we're in development mode based on available APIs
        if (window.electronAPI) {
            // In development, we typically have full API access
            return 'development';
        }

        // Default to production for safety
        return 'production';
    }
}
