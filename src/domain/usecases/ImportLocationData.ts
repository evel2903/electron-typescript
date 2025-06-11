// src/domain/usecases/ImportLocationData.ts
import { Location } from '../entities/Location';
import { ImportResult } from '../entities/ImportResult';
import { ILocationRepository } from '../repositories/ILocationRepository';

export class ImportLocationDataUseCase {
  constructor(private locationRepository: ILocationRepository) {}

  async execute(csvData: any[]): Promise<ImportResult> {
    try {
      const locations: Omit<Location, 'createdAt' | 'updatedAt'>[] = [];
      const errors: string[] = [];

      for (const row of csvData) {
        try {
          if (!row.shop_code || !row.shop_name) {
            errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
            continue;
          }

          locations.push({
            shopCode: String(row.shop_code).trim(),
            shopName: String(row.shop_name).trim()
          });
        } catch (error) {
          errors.push(`Error processing row: ${JSON.stringify(row)} - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (locations.length === 0) {
        return {
          success: false,
          message: 'No valid location records found',
          recordsProcessed: csvData.length,
          recordsInserted: 0,
          recordsUpdated: 0,
          errors
        };
      }

      const result = await this.locationRepository.bulkUpsert(locations);

      return {
        success: true,
        message: `Successfully processed ${locations.length} location records`,
        recordsProcessed: csvData.length,
        recordsInserted: result.inserted,
        recordsUpdated: result.updated,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        recordsProcessed: csvData.length,
        recordsInserted: 0,
        recordsUpdated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}