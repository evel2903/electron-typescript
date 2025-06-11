// src/domain/repositories/ISupplierRepository.ts
import { Supplier } from '../entities/Supplier';

export interface ISupplierRepository {
  upsertSupplier(supplier: Omit<Supplier, 'createdAt' | 'updatedAt'>): Promise<Supplier>;
  getSupplierByCode(supplierCode: string): Promise<Supplier | null>;
  getAllSuppliers(): Promise<Supplier[]>;
  deleteSupplier(supplierCode: string): Promise<boolean>;
  bulkUpsert(suppliers: Omit<Supplier, 'createdAt' | 'updatedAt'>[]): Promise<{ inserted: number; updated: number }>;
}