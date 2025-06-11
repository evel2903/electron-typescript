// src/infrastructure/services/FileParserService.ts - Fixed Excel parsing
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@/shared/utils/logger';
import { FileParseResult, ImportFileType } from '@/application/services/DataImportService';

export class FileParserService {
    private logger = Logger.getInstance();

    async parseFile(filePath: string): Promise<FileParseResult> {
        try {
            // Verify file exists before attempting to parse
            if (!fs.existsSync(filePath)) {
                return {
                    success: false,
                    data: [],
                    error: `File does not exist: ${filePath}`
                };
            }

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
            // Add delay to ensure file is fully written and accessible
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Verify file exists and is accessible
            const stats = fs.statSync(filePath);
            if (stats.size === 0) {
                return {
                    success: false,
                    data: [],
                    error: 'Excel file is empty'
                };
            }

            this.logger.info(`Parsing Excel file: ${filePath} (${stats.size} bytes)`);

            const XLSX = require('xlsx');
            
            // Read file as buffer first, then parse
            const fileBuffer = fs.readFileSync(filePath);
            const workbook = XLSX.read(fileBuffer, {
                type: 'buffer',
                cellStyles: false,
                cellFormulas: false,
                cellDates: true,
                cellNF: false,
                sheetStubs: false
            });

            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                return {
                    success: false,
                    data: [],
                    error: 'Excel file contains no sheets'
                };
            }

            // Use the first sheet
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            if (!sheet) {
                return {
                    success: false,
                    data: [],
                    error: 'Could not access the first sheet in Excel file'
                };
            }

            // Convert to JSON with header row
            const jsonData = XLSX.utils.sheet_to_json(sheet, {
                header: 1,
                raw: false,
                defval: '',
                blankrows: false
            });

            if (jsonData.length === 0) {
                return {
                    success: false,
                    data: [],
                    error: 'Excel sheet is empty'
                };
            }

            // First row should be headers
            const headers = jsonData[0] as string[];
            const dataRows = jsonData.slice(1).filter((row: any[]) => {
                // Filter out completely empty rows
                return Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && cell !== '');
            });

            if (headers.length === 0) {
                return {
                    success: false,
                    data: [],
                    error: 'No headers found in Excel file'
                };
            }

            // Convert to objects with proper typing
            const data = dataRows.map((row: any[]) => {
                const obj: any = {};
                headers.forEach((header, index) => {
                    // Clean up header names (remove extra spaces, normalize)
                    const cleanHeader = String(header).trim();
                    if (cleanHeader) {
                        obj[cleanHeader] = row[index] !== undefined && row[index] !== null ? String(row[index]).trim() : '';
                    }
                });
                return obj;
            });

            const detectedType = this.detectFileType(headers.map(h => String(h).trim()));

            this.logger.info(`Successfully parsed Excel file: ${data.length} data rows, detected type: ${detectedType}`);

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
        const normalizedHeaders = headers
            .filter(h => h && typeof h === 'string')
            .map(h => h.toLowerCase().trim().replace(/\s+/g, '_'));

        this.logger.debug('Detecting file type from headers:', normalizedHeaders);

        // Product file detection - look for jan_code and product_name
        if (normalizedHeaders.some(h => h.includes('jan_code') || h.includes('jan') || h.includes('barcode')) && 
            normalizedHeaders.some(h => h.includes('product_name') || h.includes('product') || h.includes('name'))) {
            return 'product';
        }

        // Location file detection - look for shop_code and shop_name
        if (normalizedHeaders.some(h => h.includes('shop_code') || h.includes('shop') || h.includes('location_code')) && 
            normalizedHeaders.some(h => h.includes('shop_name') || h.includes('location_name') || h.includes('store'))) {
            return 'location';
        }

        // Staff file detection - look for staff_code and staff_name
        if (normalizedHeaders.some(h => h.includes('staff_code') || h.includes('employee_code') || h.includes('emp_code')) && 
            normalizedHeaders.some(h => h.includes('staff_name') || h.includes('employee_name') || h.includes('emp_name'))) {
            return 'staff';
        }

        // Supplier file detection - look for supplier_code and supplier_name
        if (normalizedHeaders.some(h => h.includes('supplier_code') || h.includes('vendor_code')) && 
            normalizedHeaders.some(h => h.includes('supplier_name') || h.includes('vendor_name'))) {
            return 'supplier';
        }

        this.logger.warn('Could not detect file type from headers:', headers);
        return undefined;
    }
}