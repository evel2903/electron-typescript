// src/application/services/AppService.ts
import { GetWelcomeMessageUseCase } from '@/domain/usecases/GetWelcomeMessage';
import { GetAppInformationUseCase } from '@/domain/usecases/GetAppInformation';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IAppInfoRepository } from '@/domain/repositories/IAppInfoRepository';

export class AppService {
    private getWelcomeMessageUseCase: GetWelcomeMessageUseCase;
    private getAppInformationUseCase: GetAppInformationUseCase;

    constructor(userRepository: IUserRepository, appInfoRepository: IAppInfoRepository) {
        this.getWelcomeMessageUseCase = new GetWelcomeMessageUseCase(userRepository);
        this.getAppInformationUseCase = new GetAppInformationUseCase(appInfoRepository);
    }

    async getWelcomeMessage(): Promise<string> {
        return await this.getWelcomeMessageUseCase.execute();
    }

    async getAppInformation() {
        return await this.getAppInformationUseCase.execute();
    }
}
