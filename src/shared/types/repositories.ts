// src/shared/types/repositories.ts - New file for repository layer types
export interface IBaseRepository<T> {
    bulkUpsert(
        entities: Omit<T, 'createdAt' | 'updatedAt'>[],
    ): Promise<{ inserted: number; updated: number }>;
    getAll(): Promise<T[]>;
    getCount(): Promise<number>;
}

export interface IDataRepository<T> {
    bulkUpsert(
        data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[],
    ): Promise<{ inserted: number; updated: number }>;
    getCount(): Promise<number>;
}

export interface RepositoryResult {
    inserted: number;
    updated: number;
}

export interface ServiceResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
