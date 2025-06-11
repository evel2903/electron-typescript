// src/domain/usecases/GetWelcomeMessage.ts
import { User } from '../entities/User';
import { IUserRepository } from '../repositories/IUserRepository';

export class GetWelcomeMessageUseCase {
    constructor(private userRepository: IUserRepository) {}

    async execute(): Promise<string> {
        try {
            const user = await this.userRepository.getCurrentUser();
            return `Hello, ${user.name}! Welcome to our Clean Architecture Electron App.`;
        } catch (error) {
            return 'Hello, World! Welcome to our Clean Architecture Electron App.';
        }
    }
}
