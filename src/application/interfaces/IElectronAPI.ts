// src/application/interfaces/IElectronAPI.ts
export interface IElectronAPI {
  getVersions(): {
    node: string;
    chrome: string;
    electron: string;
  };
}