// src/infrastructure/services/ElectronAPIService.ts
import { IElectronAPI } from '@/application/interfaces/IElectronAPI';

export class ElectronAPIService implements IElectronAPI {
  getVersions(): { node: string; chrome: string; electron: string } {
    return {
      node: process.versions.node || 'Unknown',
      chrome: process.versions.chrome || 'Unknown',
      electron: process.versions.electron || 'Unknown'
    };
  }
}