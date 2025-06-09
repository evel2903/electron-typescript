// src/application/services/DIContainer.ts
import { AppService } from './AppService';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { AppInfoRepository } from '@/infrastructure/repositories/AppInfoRepository';
import { IElectronAPI } from '../interfaces/IElectronAPI';

export class DIContainer {
  private static instance: DIContainer;
  private appService: AppService | null = null;

  private constructor() {}

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  getAppService(electronAPI?: IElectronAPI): AppService {
    if (!this.appService) {
      const userRepository = new UserRepository();
      const appInfoRepository = new AppInfoRepository(electronAPI);
      this.appService = new AppService(userRepository, appInfoRepository);
    }
    return this.appService;
  }

  reset(): void {
    this.appService = null;
  }
}