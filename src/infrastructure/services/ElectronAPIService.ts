// src/infrastructure/services/ElectronAPIService.ts
import { IElectronAPI } from '@/application/interfaces/IElectronAPI';

export class ElectronAPIService implements IElectronAPI {
  getVersions(): { node: string; chrome: string; electron: string } {
    // Use the electronAPI exposed by the preload script
    if (window.electronAPI && window.electronAPI.getVersions) {
      return window.electronAPI.getVersions();
    }
    
    // Fallback values if electronAPI is not available
    return {
      node: 'Unknown',
      chrome: 'Unknown',
      electron: 'Unknown'
    };
  }
}