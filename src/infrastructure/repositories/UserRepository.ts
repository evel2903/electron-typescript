// src/infrastructure/repositories/UserRepository.ts
import { User } from '@/domain/entities/User';
import { IUserRepository } from '@/domain/repositories/IUserRepository';

export class UserRepository implements IUserRepository {
    async getCurrentUser(): Promise<User> {
        // In a real application, this would fetch from a database or API
        // For now, return a mock user
        return {
            id: '1',
            name: 'Clean Architecture User',
            email: 'user@cleanarch.com',
            createdAt: new Date(),
        };
    }

    async updateUser(user: Partial<User>): Promise<User> {
        // In a real application, this would update the user in a database
        const currentUser = await this.getCurrentUser();
        return {
            ...currentUser,
            ...user,
        };
    }
}
