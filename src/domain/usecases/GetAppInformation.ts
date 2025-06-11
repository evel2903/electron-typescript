// src/domain/usecases/GetAppInformation.ts
import { AppInfo } from '../entities/AppInfo';
import { IAppInfoRepository } from '../repositories/IAppInfoRepository';

export class GetAppInformationUseCase {
    constructor(private appInfoRepository: IAppInfoRepository) {}

    async execute(): Promise<{
        appInfo: AppInfo;
        systemInfo: {
            nodeVersion: string;
            chromeVersion: string;
            electronVersion: string;
        };
    }> {
        const [appInfo, systemInfo] = await Promise.all([
            this.appInfoRepository.getAppInfo(),
            this.appInfoRepository.getSystemInfo(),
        ]);

        return {
            appInfo,
            systemInfo,
        };
    }
}
