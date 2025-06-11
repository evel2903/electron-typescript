// src/infrastructure/services/FileParserService.ts
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@/shared/utils/logger';
import { FileParseResult, ImportFileType } from '@/application/services/DataImportService';

export class FileParserService {
  private logger = Logger.getInstance();

  async parseFile(filePath: string): Promise<FileParseResult> {
    try {
      const extension = path.extname(filePath).toLowerCase();
      
      if (extension === '.csv') {
        return await this.parseCsv(filePath);
      } else if (extension === '.xlsx' || extension === '.xls') {
        return await this.parseExcel(filePath);
      } else {
        return {
          success: false,
          data: [],
          error: `Unsupported file format: ${extension}`
        };
      }
    } catch (error) {
      this.logger.error('Error parsing file:', error as Error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown parsing error'
      };
    }
  }

  private async parseCsv(filePath: string): Promise<FileParseResult> {
    try {
      const Papa = require('papaparse');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        delimitersToGuess: [',', '\t', '|', ';']
      });

      if (parseResult.errors && parseResult.errors.length > 0) {
        this.logger.warn('CSV parsing warnings:', parseResult.errors);
      }

      const headers = parseResult.meta.fields || [];
      const detectedType = this.detectFileType(headers);

      return {
        success: true,
        data: parseResult.data || [],
        detectedType
      };
    } catch (error) {
      this.logger.error('Error parsing CSV:', error as Error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'CSV parsing error'
      };
    }
  }

  private async parseExcel(filePath: string): Promise<FileParseResult> {
    try {
      const XLSX = require('xlsx');
      const workbook = XLSX.readFile(filePath);
      
      // Use the first sheet
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with header
      const jsonData = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: false,
        defval: ''
      });

      if (jsonData.length === 0) {
        return {
          success: false,
          data: [],
          error: 'Excel file is empty'
        };
      }

      // First row should be headers
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1);

      // Convert to objects with proper typing
      const data = dataRows.map((row: any[]) => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });

      const detectedType = this.detectFileType(headers);

      return {
        success: true,
        data,
        detectedType
      };
    } catch (error) {
      this.logger.error('Error parsing Excel:', error as Error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Excel parsing error'
      };
    }
  }

  private detectFileType(headers: string[]): ImportFileType | undefined {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

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
    if (normalizedHeaders.includes('supplier_code') && normalizedHeaders.includes('supplier_name')) {
      return 'supplier';
    }

    return undefined;
  }
}