// src/domain/entities/ImportResult.ts
export interface ImportResult {
  success: boolean;
  message: string;
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  errors?: string[];
}