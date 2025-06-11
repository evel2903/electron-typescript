// src/application/services/DataImportService.ts
import { ImportResult } from '@/domain/entities/ImportResult';
import { ImportProductDataUseCase } from '@/domain/usecases/ImportProductData';
import { ImportLocationDataUseCase } from '@/domain/usecases/ImportLocationData';
import { ImportStaffDataUseCase } from '@/domain/usecases/ImportStaffData';
import { ImportSupplierDataUseCase } from '@/domain/usecases/ImportSupplierData';
import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { ILocationRepository } from '@/domain/repositories/ILocationRepository';
import { IStaffRepository } from '@/domain/repositories/IStaffRepository';
import { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';

export type ImportFileType = 'product' | 'location' | 'staff' | 'supplier';

export interface FileParseResult {
    success: boolean;
    data: any[];
    error?: string;
    detectedType?: ImportFileType;
}

export class DataImportService {
    private importProductDataUseCase: ImportProductDataUseCase;
    private importLocationDataUseCase: ImportLocationDataUseCase;
    private importStaffDataUseCase: ImportStaffDataUseCase;
    private importSupplierDataUseCase: ImportSupplierDataUseCase;

    constructor(
        productRepository: IProductRepository,
        locationRepository: ILocationRepository,
        staffRepository: IStaffRepository,
        supplierRepository: ISupplierRepository,
    ) {
        this.importProductDataUseCase = new ImportProductDataUseCase(productRepository);
        this.importLocationDataUseCase = new ImportLocationDataUseCase(locationRepository);
        this.importStaffDataUseCase = new ImportStaffDataUseCase(staffRepository);
        this.importSupplierDataUseCase = new ImportSupplierDataUseCase(supplierRepository);
    }

    async importData(csvData: any[], fileType: ImportFileType): Promise<ImportResult> {
        switch (fileType) {
            case 'product':
                return await this.importProductDataUseCase.execute(csvData);
            case 'location':
                return await this.importLocationDataUseCase.execute(csvData);
            case 'staff':
                return await this.importStaffDataUseCase.execute(csvData);
            case 'supplier':
                return await this.importSupplierDataUseCase.execute(csvData);
            default:
                return {
                    success: false,
                    message: `Unknown file type: ${fileType}`,
                    recordsProcessed: 0,
                    recordsInserted: 0,
                    recordsUpdated: 0,
                    errors: [`Unsupported file type: ${fileType}`],
                };
        }
    }

    detectFileType(headers: string[]): ImportFileType | null {
        const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

        // Product file detection
        if (normalizedHeaders.includes('jan_code') && normalizedHeaders.includes('product_name')) {
            return 'product';
        }

        // Location file detection
        if (normalizedHeaders.includes('shop_code') && normalizedHeaders.includes('shop_name')) {
            return 'location';
        }

        // Staff file detection
        if (normalizedHeaders.includes('staff_code') && normalizedHeaders.includes('staff_name')) {
            return 'staff';
        }

        // Supplier file detection
        if (
            normalizedHeaders.includes('supplier_code') &&
            normalizedHeaders.includes('supplier_name')
        ) {
            return 'supplier';
        }

        return null;
    }
}
