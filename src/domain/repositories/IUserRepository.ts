// src/domain/repositories/IUserRepository.ts
import { User } from '../entities/User';

export interface IUserRepository {
    getCurrentUser(): Promise<User>;
    updateUser(user: Partial<User>): Promise<User>;
}
