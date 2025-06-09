// src/application/services/DIContainer.ts - Updated to include Android services
import { AppService } from './AppService';
import { AndroidDeviceService } from './AndroidDeviceService';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { AppInfoRepository } from '@/infrastructure/repositories/AppInfoRepository';
import { AndroidDeviceRepository } from '@/infrastructure/repositories/AndroidDeviceRepository';
import { AdbService } from '@/infrastructure/services/AdbService';
import { IElectronAPI } from '../interfaces/IElectronAPI';

export class DIContainer {
  private static instance: DIContainer;
  private appService: AppService | null = null;
  private androidDeviceService: AndroidDeviceService | null = null;

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

  getAndroidDeviceService(): AndroidDeviceService {
    if (!this.androidDeviceService) {
      const adbService = new AdbService();
      const androidDeviceRepository = new AndroidDeviceRepository(adbService);
      this.androidDeviceService = new AndroidDeviceService(androidDeviceRepository);
    }
    return this.androidDeviceService;
  }

  reset(): void {
    this.appService = null;
    this.androidDeviceService = null;
  }
}