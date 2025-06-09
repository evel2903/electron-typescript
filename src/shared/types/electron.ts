// src/shared/types/electron.ts
export interface ElectronAPI {
  getVersions(): {
    node: string;
    chrome: string;
    electron: string;
  };
  getPlatform(): string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}