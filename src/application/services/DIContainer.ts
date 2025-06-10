// src/application/services/DIContainer.ts - Updated with SettingService
import { AppService } from './AppService';
import { AndroidDeviceService } from './AndroidDeviceService';
import { SettingService } from './SettingService';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { AppInfoRepository } from '@/infrastructure/repositories/AppInfoRepository';
import { AndroidDeviceRepository } from '@/infrastructure/repositories/AndroidDeviceRepository';
import { SettingRepository } from '@/infrastructure/repositories/SettingRepository';
import { IElectronAPI } from '../interfaces/IElectronAPI';

export class DIContainer {
  private static instance: DIContainer;
  private appService: AppService | null = null;
  private androidDeviceService: AndroidDeviceService | null = null;
  private settingService: SettingService | null = null;

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
      // AndroidDeviceRepository now uses IPC instead of direct AdbService
      const androidDeviceRepository = new AndroidDeviceRepository();
      this.androidDeviceService = new AndroidDeviceService(androidDeviceRepository);
    }
    return this.androidDeviceService;
  }

  getSettingService(): SettingService {
    if (!this.settingService) {
      const settingRepository = new SettingRepository();
      this.settingService = new SettingService(settingRepository);
    }
    return this.settingService;
  }

  reset(): void {
    this.appService = null;
    this.androidDeviceService = null;
    this.settingService = null;
  }
}