// src/domain/entities/FileTransferResult.ts
export interface FileTransferResult {
    success: boolean;
    message: string;
    transferredBytes?: number;
    error?: string;
}
