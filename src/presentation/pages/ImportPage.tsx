// src/presentation/pages/ImportPage.tsx - Updated to use service layer architecture
import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
    Container,
    Typography,
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Checkbox,
    Chip,
    Card,
    CardContent,
    TableFooter,
    Tooltip,
    Snackbar,
    Alert,
    CircularProgress,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    Grid,
    Menu,
    MenuItem,
} from '@mui/material';
import {
    Upload,
    Delete,
    Clear,
    InsertDriveFile,
    TableChart,
    Description,
    PhoneAndroid,
    CloudUpload,
    CheckCircle,
    Error as ErrorIcon,
    Warning,
    Refresh,
    Storage,
    ExpandMore,
    Assignment,
    Business,
    Group,
    Inventory,
    Assessment,
    Download,
    ArrowDropDown,
} from '@mui/icons-material';
import { AndroidDevice } from '@/domain/entities/AndroidDevice';
import { FileTransferResult } from '@/domain/entities/FileTransferResult';
import { ImportResult } from '@/domain/entities/ImportResult';
import { ImportFileType } from '@/application/services/DataImportService';
import { DIContainer, RendererDataService } from '@/application/services/DIContainer';
import { SETTING_KEYS } from '@/shared/constants/settings';

interface ImportedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    dateAdded: Date;
    file: File;
    transferStatus?: 'pending' | 'transferring' | 'completed' | 'failed';
    transferProgress?: number;
    transferError?: string;
    tempFilePath?: string;
    detectedFileType?: ImportFileType | null;
    importStatus?: 'pending' | 'importing' | 'completed' | 'failed';
    importResult?: ImportResult;
}

interface TransferProgress {
    currentFile: number;
    totalFiles: number;
    currentFileName: string;
    overallProgress: number;
}

interface DataCounts {
    inventory: number;
    stockin: number;
    stockout: number;
    products: number;
    locations: number;
    staff: number;
    suppliers: number;
}

interface ImportPageProps {
    connectedDevice?: AndroidDevice | null;
}

export const ImportPage: React.FC<ImportPageProps> = ({ connectedDevice }) => {
    const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [transferring, setTransferring] = useState<boolean>(false);
    const [importing, setImporting] = useState<boolean>(false);
    const [transferProgress, setTransferProgress] = useState<TransferProgress | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [importPath, setImportPath] = useState<string>('');
    const [importResults, setImportResults] = useState<ImportResult[]>([]);
    const [dataCounts, setDataCounts] = useState<DataCounts | null>(null);
    const [loadingCounts, setLoadingCounts] = useState<boolean>(false);
    const [templateMenuAnchor, setTemplateMenuAnchor] = useState<HTMLElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const androidDeviceService = DIContainer.getInstance().getAndroidDeviceService();
    const settingService = DIContainer.getInstance().getSettingService();
    const dataService = RendererDataService.getInstance();

    const ALLOWED_TYPES = [
        '.csv',
        '.xlsx',
        '.xls',
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
    ];

    // Template definitions for different data types
    const TEMPLATE_DEFINITIONS = {
        product: {
            name: 'Product Template',
            filename: 'product_template.xlsx',
            sheetName: 'Products',
            headers: [
                'jan_code',
                'product_name',
                'box_quantity',
                'supplier_code',
                'stock_in_alert',
                'stock_out_alert'
            ],
            sampleData: [
                ['GO20254200001', 'Oneplus 11 64', 5, 'SP20253400001', 5, 20],
                ['GO20254200002', 'Oneplus 11 128', 5, 'SP20253400001', 5, 20],
            ]
        },
        location: {
            name: 'Location Template',
            filename: 'location_template.xlsx',
            sheetName: 'Locations',
            headers: [
                'shop_code',
                'shop_name'
            ],
            sampleData: [
                ['WH20253400001', 'Kho điện thoại'],
                ['WH20253400002', 'Kho máy tính'],
            ]
        },
        staff: {
            name: 'Staff Template',
            filename: 'staff_template.xlsx',
            sheetName: 'Staff',
            headers: [
                'staff_code',
                'staff_name'
            ],
            sampleData: [
                ['US00000000001', 'Admin'],
                ['US00000000002', 'Staff']
            ]
        },
        supplier: {
            name: 'Supplier Template',
            filename: 'supplier_template.xlsx',
            sheetName: 'Suppliers',
            headers: [
                'supplier_code',
                'supplier_name'
            ],
            sampleData: [
                ['SP20253400001', 'KSS 1'],
                ['SP20253400002', 'KSS 2'],
            ]
        }
    };

    useEffect(() => {
        loadImportPath();
        loadDataCounts();

        return () => {
            cleanupAllTemporaryFiles();
        };
    }, []);

    useEffect(() => {
        // Refresh data counts after successful imports
        if (importResults.length > 0 && importResults.some((result) => result.success)) {
            loadDataCounts();
        }
    }, [importResults]);

    const loadImportPath = async () => {
        try {
            const path = await settingService.getSettingValue(SETTING_KEYS.FILE_IMPORT_PATH);
            setImportPath(path || '/sdcard/Downloads');
        } catch (error) {
            console.error('Failed to load import path:', error);
            setImportPath('/sdcard/Downloads');
        }
    };

    const loadDataCounts = async () => {
        setLoadingCounts(true);
        try {
            const counts = await dataService.getDataCounts();
            setDataCounts(counts);
        } catch (error) {
            console.error('Failed to load data counts:', error);
            setDataCounts({
                inventory: 0,
                stockin: 0,
                stockout: 0,
                products: 0,
                locations: 0,
                staff: 0,
                suppliers: 0,
            });
        } finally {
            setLoadingCounts(false);
        }
    };

    const handleRefreshCounts = async () => {
        await loadDataCounts();
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileTypeIcon = (type: string) => {
        if (type.includes('csv')) {
            return <TableChart sx={{ color: '#4caf50' }} />;
        } else if (type.includes('sheet') || type.includes('excel')) {
            return <Description sx={{ color: '#2e7d32' }} />;
        }
        return <InsertDriveFile sx={{ color: '#757575' }} />;
    };

    const getFileTypeLabel = (file: File): string => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension === 'csv') return 'CSV';
        if (extension === 'xlsx') return 'Excel (XLSX)';
        if (extension === 'xls') return 'Excel (XLS)';
        return 'Unknown';
    };

    const getDetectedTypeIcon = (detectedType?: ImportFileType | null) => {
        switch (detectedType) {
            case 'product':
                return <Inventory sx={{ color: '#2196f3' }} />;
            case 'location':
                return <Business sx={{ color: '#ff9800' }} />;
            case 'staff':
                return <Group sx={{ color: '#9c27b0' }} />;
            case 'supplier':
                return <Assignment sx={{ color: '#f44336' }} />;
            default:
                return <Warning sx={{ color: '#757575' }} />;
        }
    };

    const getDetectedTypeLabel = (detectedType?: ImportFileType | null): string => {
        switch (detectedType) {
            case 'product':
                return 'Product Data';
            case 'location':
                return 'Location Data';
            case 'staff':
                return 'Staff Data';
            case 'supplier':
                return 'Supplier Data';
            default:
                return 'Unknown Type';
        }
    };

    const getTransferStatusIcon = (status?: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle sx={{ color: 'success.main' }} />;
            case 'failed':
                return <ErrorIcon sx={{ color: 'error.main' }} />;
            case 'transferring':
                return <CircularProgress size={20} />;
            default:
                return null;
        }
    };

    const getImportStatusIcon = (status?: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle sx={{ color: 'success.main' }} />;
            case 'failed':
                return <ErrorIcon sx={{ color: 'error.main' }} />;
            case 'importing':
                return <CircularProgress size={20} />;
            default:
                return null;
        }
    };

    const isValidFile = (file: File): boolean => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        return ALLOWED_TYPES.includes(extension) || ALLOWED_TYPES.includes(file.type);
    };

    const createTemporaryFile = async (file: File): Promise<string> => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const tempPath = await window.electronAPI.fs.writeTemporaryFile(file.name, arrayBuffer);
            console.log(`Temporary file created at: ${tempPath}`);
            return tempPath;
        } catch (error) {
            console.error('Failed to create temporary file:', error);
            throw new Error(
                `Failed to create temporary file for ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    };

    const cleanupTemporaryFile = async (filePath: string): Promise<void> => {
        try {
            const success = await window.electronAPI.fs.cleanupTemporaryFile(filePath);
            if (success) {
                console.log(`Temporary file cleaned up: ${filePath}`);
            } else {
                console.warn(`Failed to cleanup temporary file: ${filePath}`);
            }
        } catch (error) {
            console.error('Failed to cleanup temporary file:', error);
        }
    };

    const cleanupAllTemporaryFiles = async (): Promise<void> => {
        const filesToCleanup = importedFiles.filter((file) => file.tempFilePath);

        for (const file of filesToCleanup) {
            if (file.tempFilePath) {
                await cleanupTemporaryFile(file.tempFilePath);
            }
        }
    };

    const detectFileTypeAndParse = async (file: ImportedFile): Promise<ImportedFile> => {
        try {
            const tempPath = await createTemporaryFile(file.file);
            const parseResult = await window.electronAPI.import.parseFile(tempPath);

            await cleanupTemporaryFile(tempPath);

            if (parseResult.success && parseResult.detectedType) {
                return {
                    ...file,
                    detectedFileType: parseResult.detectedType,
                };
            } else {
                console.warn(`Could not detect file type for ${file.name}: ${parseResult.error}`);
                return {
                    ...file,
                    detectedFileType: null,
                };
            }
        } catch (error) {
            console.error(`Error detecting file type for ${file.name}:`, error);
            return {
                ...file,
                detectedFileType: null,
            };
        }
    };

    const generateExcelContent = (template: any) => {
        try {
            // Create a new workbook
            const workbook = XLSX.utils.book_new();
            
            // Prepare data with headers as first row
            const worksheetData = [template.headers, ...template.sampleData];
            
            // Create worksheet from data
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            
            // Auto-size columns based on content
            const colWidths = template.headers.map((header: string, index: number) => {
                const headerLength = header.length;
                const maxDataLength = Math.max(
                    ...template.sampleData.map((row: any[]) => 
                        row[index] ? String(row[index]).length : 0
                    )
                );
                return { wch: Math.max(headerLength, maxDataLength, 10) };
            });
            worksheet['!cols'] = colWidths;
            
            // Style the header row (make it bold)
            const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
            for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                if (worksheet[cellAddress]) {
                    worksheet[cellAddress].s = {
                        font: { bold: true },
                        fill: { fgColor: { rgb: "E8F4FD" } },
                        border: {
                            top: { style: "thin" },
                            bottom: { style: "thin" },
                            left: { style: "thin" },
                            right: { style: "thin" }
                        }
                    };
                }
            }
            
            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, template.sheetName);
            
            // Generate Excel file buffer
            const excelBuffer = XLSX.write(workbook, { 
                bookType: 'xlsx', 
                type: 'array',
                cellStyles: true
            });
            
            return new Blob([excelBuffer], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
        } catch (error) {
            console.error('Error generating Excel content:', error);
            throw error;
        }
    };

    const downloadTemplate = (templateType: ImportFileType) => {
        const template = TEMPLATE_DEFINITIONS[templateType];
        if (!template) {
            setError('Template not found for the selected type');
            return;
        }

        try {
            const excelBlob = generateExcelContent(template);
            const link = document.createElement('a');
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(excelBlob);
                link.setAttribute('href', url);
                link.setAttribute('download', template.filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                setSuccess(`${template.name} downloaded successfully`);
            } else {
                setError('Download not supported in this browser');
            }
        } catch (error) {
            console.error('Failed to download template:', error);
            setError('Failed to download template file');
        }
    };

    const handleTemplateMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setTemplateMenuAnchor(event.currentTarget);
    };

    const handleTemplateMenuClose = () => {
        setTemplateMenuAnchor(null);
    };

    const handleTemplateDownload = (templateType: ImportFileType) => {
        downloadTemplate(templateType);
        handleTemplateMenuClose();
    };

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);

        if (files.length === 0) return;

        const validFiles = files.filter(isValidFile);

        const newImportedFiles: ImportedFile[] = validFiles.map((file) => ({
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            name: file.name,
            size: file.size,
            type: getFileTypeLabel(file),
            dateAdded: new Date(),
            file,
            transferStatus: 'pending',
            importStatus: 'pending',
            detectedFileType: null,
        }));

        setImportedFiles((prev) => [...prev, ...newImportedFiles]);

        const updatedFiles = await Promise.all(
            newImportedFiles.map((file) => detectFileTypeAndParse(file)),
        );

        setImportedFiles((prev) => {
            const updated = [...prev];
            updatedFiles.forEach((updatedFile) => {
                const index = updated.findIndex((f) => f.id === updatedFile.id);
                if (index !== -1) {
                    updated[index] = updatedFile;
                }
            });
            return updated;
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedFiles(new Set(importedFiles.map((file) => file.id)));
        } else {
            setSelectedFiles(new Set());
        }
    };

    const handleSelectFile = (fileId: string) => {
        const newSelected = new Set(selectedFiles);
        if (newSelected.has(fileId)) {
            newSelected.delete(fileId);
        } else {
            newSelected.add(fileId);
        }
        setSelectedFiles(newSelected);
    };

    const handleDeleteFile = async (fileId: string) => {
        const fileToDelete = importedFiles.find((file) => file.id === fileId);

        if (fileToDelete?.tempFilePath) {
            await cleanupTemporaryFile(fileToDelete.tempFilePath);
        }

        setImportedFiles((prev) => prev.filter((file) => file.id !== fileId));
        setSelectedFiles((prev) => {
            const newSelected = new Set(prev);
            newSelected.delete(fileId);
            return newSelected;
        });
    };

    const handleDeleteSelected = async () => {
        const filesToDelete = importedFiles.filter((file) => selectedFiles.has(file.id));

        for (const file of filesToDelete) {
            if (file.tempFilePath) {
                await cleanupTemporaryFile(file.tempFilePath);
            }
        }

        setImportedFiles((prev) => prev.filter((file) => !selectedFiles.has(file.id)));
        setSelectedFiles(new Set());
    };

    const handleClearAll = async () => {
        await cleanupAllTemporaryFiles();
        setImportedFiles([]);
        setSelectedFiles(new Set());
        setImportResults([]);
    };

    const importToDatabase = async (file: ImportedFile): Promise<ImportResult> => {
        try {
            if (!file.detectedFileType) {
                return {
                    success: false,
                    message: 'File type not detected',
                    recordsProcessed: 0,
                    recordsInserted: 0,
                    recordsUpdated: 0,
                    errors: ['Unable to detect file type for database import'],
                };
            }

            const tempPath = await createTemporaryFile(file.file);
            const parseResult = await window.electronAPI.import.parseFile(tempPath);

            await cleanupTemporaryFile(tempPath);

            if (!parseResult.success) {
                return {
                    success: false,
                    message: parseResult.error || 'Failed to parse file',
                    recordsProcessed: 0,
                    recordsInserted: 0,
                    recordsUpdated: 0,
                    errors: [parseResult.error || 'Unknown parsing error'],
                };
            }

            const result = await window.electronAPI.import.importData(
                parseResult.data,
                file.detectedFileType,
            );
            return result;
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                recordsProcessed: 0,
                recordsInserted: 0,
                recordsUpdated: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
        }
    };

    const handleImportToDevice = async () => {
        if (!connectedDevice) {
            setError('No device connected. Please connect an Android device first.');
            return;
        }

        if (importedFiles.length === 0) {
            setError('No files to process. Please import some files first.');
            return;
        }

        setTransferring(true);
        setImporting(true);
        setError(null);
        setSuccess(null);
        setImportResults([]);

        const filesToProcess =
            selectedFiles.size > 0
                ? importedFiles.filter((file) => selectedFiles.has(file.id))
                : importedFiles;

        if (filesToProcess.length === 0) {
            setError('No files selected for processing.');
            setTransferring(false);
            setImporting(false);
            return;
        }

        let transferSuccessCount = 0;
        let transferFailureCount = 0;
        let importSuccessCount = 0;
        let importFailureCount = 0;
        const createdTempFiles: string[] = [];
        const currentImportResults: ImportResult[] = [];

        try {
            for (let i = 0; i < filesToProcess.length; i++) {
                const file = filesToProcess[i];

                setTransferProgress({
                    currentFile: i + 1,
                    totalFiles: filesToProcess.length,
                    currentFileName: file.name,
                    overallProgress: Math.round((i / filesToProcess.length) * 100),
                });

                setImportedFiles((prev) =>
                    prev.map((f) =>
                        f.id === file.id
                            ? {
                                  ...f,
                                  transferStatus: 'transferring' as const,
                                  importStatus: 'importing' as const,
                              }
                            : f,
                    ),
                );

                try {
                    const tempPath = await createTemporaryFile(file.file);
                    createdTempFiles.push(tempPath);

                    setImportedFiles((prev) =>
                        prev.map((f) => (f.id === file.id ? { ...f, tempFilePath: tempPath } : f)),
                    );

                    const [transferResult, importResult] = await Promise.all([
                        androidDeviceService.uploadFile(
                            connectedDevice.id,
                            tempPath,
                            `${importPath}/Import/${file.name}`,
                        ),
                        importToDatabase(file),
                    ]);

                    if (transferResult.success) {
                        transferSuccessCount++;
                        setImportedFiles((prev) =>
                            prev.map((f) =>
                                f.id === file.id
                                    ? { ...f, transferStatus: 'completed' as const }
                                    : f,
                            ),
                        );
                    } else {
                        transferFailureCount++;
                        setImportedFiles((prev) =>
                            prev.map((f) =>
                                f.id === file.id
                                    ? {
                                          ...f,
                                          transferStatus: 'failed' as const,
                                          transferError:
                                              transferResult.error || transferResult.message,
                                      }
                                    : f,
                            ),
                        );
                    }

                    if (importResult.success) {
                        importSuccessCount++;
                        setImportedFiles((prev) =>
                            prev.map((f) =>
                                f.id === file.id
                                    ? {
                                          ...f,
                                          importStatus: 'completed' as const,
                                          importResult,
                                      }
                                    : f,
                            ),
                        );
                    } else {
                        importFailureCount++;
                        setImportedFiles((prev) =>
                            prev.map((f) =>
                                f.id === file.id
                                    ? {
                                          ...f,
                                          importStatus: 'failed' as const,
                                          importResult,
                                      }
                                    : f,
                            ),
                        );
                    }

                    currentImportResults.push(importResult);
                } catch (err) {
                    transferFailureCount++;
                    importFailureCount++;
                    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                    setImportedFiles((prev) =>
                        prev.map((f) =>
                            f.id === file.id
                                ? {
                                      ...f,
                                      transferStatus: 'failed' as const,
                                      importStatus: 'failed' as const,
                                      transferError: errorMessage,
                                      importResult: {
                                          success: false,
                                          message: errorMessage,
                                          recordsProcessed: 0,
                                          recordsInserted: 0,
                                          recordsUpdated: 0,
                                          errors: [errorMessage],
                                      },
                                  }
                                : f,
                        ),
                    );
                }
            }

            setTransferProgress({
                currentFile: filesToProcess.length,
                totalFiles: filesToProcess.length,
                currentFileName: '',
                overallProgress: 100,
            });

            if (transferSuccessCount > 0) {
                try {
                    const interfaceContent = '{clearData:false,importFlg:true}';
                    const interfaceFileName = 'interface.txt';

                    const interfaceBlob = new Blob([interfaceContent], { type: 'text/plain' });
                    const interfaceFile = new File([interfaceBlob], interfaceFileName, {
                        type: 'text/plain',
                    });
                    const interfaceTempPath = await createTemporaryFile(interfaceFile);
                    createdTempFiles.push(interfaceTempPath);

                    await androidDeviceService.uploadFile(
                        connectedDevice.id,
                        interfaceTempPath,
                        `${importPath}/Interface/${interfaceFileName}`,
                    );

                    console.log('Interface file created successfully');
                } catch (error) {
                    console.error('Failed to create interface file:', error);
                }
            }

            setImportResults(currentImportResults);

            const totalSuccessful = Math.min(transferSuccessCount, importSuccessCount);
            const anyFailures = transferFailureCount > 0 || importFailureCount > 0;

            if (totalSuccessful > 0 && !anyFailures) {
                setSuccess(
                    `Successfully processed ${totalSuccessful} files: transferred to ${connectedDevice.model || connectedDevice.serialNumber} and imported to database`,
                );
            } else if (totalSuccessful > 0 && anyFailures) {
                setError(
                    `Processing completed with mixed results: ${totalSuccessful} fully successful, ${transferFailureCount + importFailureCount} with failures`,
                );
            } else {
                setError(`Processing failed: files could not be transferred or imported`);
            }

            // Refresh data counts after successful imports
            await loadDataCounts();
        } finally {
            for (const tempPath of createdTempFiles) {
                await cleanupTemporaryFile(tempPath);
            }

            setImportedFiles((prev) => prev.map((f) => ({ ...f, tempFilePath: undefined })));

            setTimeout(() => {
                setTransferring(false);
                setImporting(false);
                setTransferProgress(null);
            }, 2000);
        }
    };

    const handleCloseError = () => {
        setError(null);
    };

    const handleCloseSuccess = () => {
        setSuccess(null);
    };

    const isAllSelected = importedFiles.length > 0 && selectedFiles.size === importedFiles.length;
    const isSomeSelected = selectedFiles.size > 0 && selectedFiles.size < importedFiles.length;

    return (
        <>
            <Container maxWidth="lg">
                <Box py={4}>
                    <Typography variant="h3" component="h1" gutterBottom>
                        Import Files
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        Import CSV and Excel files for database storage and transfer to Android
                        devices. Files will be automatically parsed and stored in the local database
                        while simultaneously being transferred to your connected device.
                    </Typography>

                    {/* Current Data Overview */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                                mb={2}
                            >
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Assessment sx={{ color: 'primary.main' }} />
                                    <Typography variant="h6">Current Database Status</Typography>
                                </Box>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={
                                        loadingCounts ? <CircularProgress size={16} /> : <Refresh />
                                    }
                                    onClick={handleRefreshCounts}
                                    disabled={loadingCounts || transferring || importing}
                                >
                                    Refresh
                                </Button>
                            </Box>

                            {loadingCounts ? (
                                <Box display="flex" justifyContent="center" py={2}>
                                    <CircularProgress size={24} />
                                </Box>
                            ) : dataCounts ? (
                                <Grid container spacing={2}>
                                    <Grid item xs={6} md={3}>
                                        <Box
                                            textAlign="center"
                                            p={1}
                                            border={1}
                                            borderColor="divider"
                                            borderRadius={1}
                                        >
                                            <Typography variant="h5" color="primary">
                                                {dataCounts.products.toLocaleString()}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Products
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Box
                                            textAlign="center"
                                            p={1}
                                            border={1}
                                            borderColor="divider"
                                            borderRadius={1}
                                        >
                                            <Typography variant="h5" color="primary">
                                                {dataCounts.locations.toLocaleString()}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Locations
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Box
                                            textAlign="center"
                                            p={1}
                                            border={1}
                                            borderColor="divider"
                                            borderRadius={1}
                                        >
                                            <Typography variant="h5" color="primary">
                                                {dataCounts.staff.toLocaleString()}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Staff
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Box
                                            textAlign="center"
                                            p={1}
                                            border={1}
                                            borderColor="divider"
                                            borderRadius={1}
                                        >
                                            <Typography variant="h5" color="primary">
                                                {dataCounts.suppliers.toLocaleString()}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Suppliers
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Unable to load database counts
                                </Typography>
                            )}
                        </CardContent>
                    </Card>

                    {/* Transfer Progress */}
                    {transferProgress && (
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={2} mb={2}>
                                    <CloudUpload sx={{ color: 'primary.main' }} />
                                    <Typography variant="h6">
                                        Processing Files:{' '}
                                        {connectedDevice?.model || connectedDevice?.serialNumber}
                                    </Typography>
                                </Box>

                                <Typography variant="body2" color="text.secondary" mb={1}>
                                    File {transferProgress.currentFile} of{' '}
                                    {transferProgress.totalFiles}:{' '}
                                    {transferProgress.currentFileName}
                                </Typography>

                                <LinearProgress
                                    variant="determinate"
                                    value={transferProgress.overallProgress}
                                    sx={{ mb: 1 }}
                                />

                                <Typography variant="caption" color="text.secondary">
                                    {transferProgress.overallProgress}% complete (transferring to
                                    device and importing to database)
                                </Typography>
                            </CardContent>
                        </Card>
                    )}

                    {/* Import Results Summary */}
                    {importResults.length > 0 && (
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Database Import Summary
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                {importResults.map((result, index) => (
                                    <Accordion key={index}>
                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                {result.success ? (
                                                    <CheckCircle sx={{ color: 'success.main' }} />
                                                ) : (
                                                    <ErrorIcon sx={{ color: 'error.main' }} />
                                                )}
                                                <Typography variant="body2">
                                                    {result.message} ({result.recordsInserted}{' '}
                                                    inserted, {result.recordsUpdated} updated)
                                                </Typography>
                                            </Box>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Typography variant="body2" color="text.secondary">
                                                Records processed: {result.recordsProcessed}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Records inserted: {result.recordsInserted}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Records updated: {result.recordsUpdated}
                                            </Typography>
                                            {result.errors && result.errors.length > 0 && (
                                                <Box mt={1}>
                                                    <Typography variant="body2" color="error">
                                                        Errors:
                                                    </Typography>
                                                    {result.errors.map((error, errorIndex) => (
                                                        <Typography
                                                            key={errorIndex}
                                                            variant="caption"
                                                            color="error"
                                                            display="block"
                                                        >
                                                            • {error}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            )}
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Device Status Display */}
                    {connectedDevice && (
                        <Card sx={{ mb: 3, p: 2 }}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <CheckCircle sx={{ color: 'success.main' }} />
                                <Typography variant="h6">
                                    Ready to process files with{' '}
                                    {connectedDevice.model || connectedDevice.serialNumber}
                                </Typography>
                                <Chip
                                    label={`Target: ${importPath}/Import`}
                                    size="small"
                                    variant="outlined"
                                />
                                <Chip
                                    label="Database Import Enabled"
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                            </Box>
                        </Card>
                    )}

                    {/* File Selection Card */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                                flexWrap="wrap"
                                gap={2}
                            >
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        File Selection
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Select CSV or Excel files from your computer. Files will be
                                        automatically detected and imported to database.
                                    </Typography>
                                </Box>

                                <Box display="flex" gap={2} flexWrap="wrap">
                                    <Button
                                        variant="outlined"
                                        startIcon={<Download />}
                                        endIcon={<ArrowDropDown />}
                                        onClick={handleTemplateMenuOpen}
                                        disabled={transferring || importing}
                                    >
                                        Download Template
                                    </Button>

                                    <Button
                                        variant="contained"
                                        startIcon={<Upload />}
                                        onClick={handleFileSelect}
                                        disabled={transferring || importing}
                                    >
                                        Select Files
                                    </Button>

                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        startIcon={
                                            transferring || importing ? (
                                                <CircularProgress size={20} />
                                            ) : (
                                                <Storage />
                                            )
                                        }
                                        onClick={handleImportToDevice}
                                        disabled={
                                            !connectedDevice ||
                                            importedFiles.length === 0 ||
                                            transferring ||
                                            importing
                                        }
                                    >
                                        {transferring || importing
                                            ? 'Processing...'
                                            : 'Process Files'}
                                    </Button>

                                    {selectedFiles.size > 0 && (
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            startIcon={<Delete />}
                                            onClick={handleDeleteSelected}
                                            disabled={transferring || importing}
                                        >
                                            Delete Selected ({selectedFiles.size})
                                        </Button>
                                    )}

                                    {importedFiles.length > 0 && (
                                        <Button
                                            variant="outlined"
                                            color="warning"
                                            startIcon={<Clear />}
                                            onClick={handleClearAll}
                                            disabled={transferring || importing}
                                        >
                                            Clear All
                                        </Button>
                                    )}
                                </Box>
                            </Box>

                            <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                                <Chip
                                    label={`${importedFiles.length} files imported`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                                <Chip
                                    label="Supported: CSV, XLS, XLSX"
                                    size="small"
                                    variant="outlined"
                                />
                                {selectedFiles.size > 0 && (
                                    <Chip
                                        label={`${selectedFiles.size} selected for processing`}
                                        size="small"
                                        color="secondary"
                                        variant="outlined"
                                    />
                                )}
                                <Chip
                                    label="Auto-detects: Product, Location, Staff, Supplier"
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                />
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Files Table */}
                    <Paper elevation={1}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                indeterminate={isSomeSelected}
                                                checked={isAllSelected}
                                                onChange={handleSelectAll}
                                                disabled={
                                                    importedFiles.length === 0 ||
                                                    transferring ||
                                                    importing
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>File</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Detected Data</TableCell>
                                        <TableCell align="right">Size</TableCell>
                                        <TableCell>Date Added</TableCell>
                                        <TableCell>Transfer Status</TableCell>
                                        <TableCell>Import Status</TableCell>
                                        <TableCell align="center">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {importedFiles.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center">
                                                <Box py={4}>
                                                    <InsertDriveFile
                                                        sx={{
                                                            fontSize: 48,
                                                            color: 'text.disabled',
                                                            mb: 1,
                                                        }}
                                                    />
                                                    <Typography
                                                        variant="body1"
                                                        color="text.secondary"
                                                    >
                                                        No files imported yet
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.disabled"
                                                    >
                                                        Click "Select Files" to import CSV or Excel
                                                        files for database storage and device
                                                        transfer
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        importedFiles.map((file) => (
                                            <TableRow
                                                key={file.id}
                                                hover
                                                selected={selectedFiles.has(file.id)}
                                                sx={{ cursor: 'pointer' }}
                                                onClick={() =>
                                                    !transferring &&
                                                    !importing &&
                                                    handleSelectFile(file.id)
                                                }
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={selectedFiles.has(file.id)}
                                                        onChange={() => handleSelectFile(file.id)}
                                                        disabled={transferring || importing}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center">
                                                        {getFileTypeIcon(file.file.type)}
                                                        <Box ml={1}>
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight="medium"
                                                            >
                                                                {file.name}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={file.type}
                                                        size="small"
                                                        variant="outlined"
                                                        color={
                                                            file.type === 'CSV'
                                                                ? 'success'
                                                                : 'primary'
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        {getDetectedTypeIcon(file.detectedFileType)}
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                        >
                                                            {getDetectedTypeLabel(
                                                                file.detectedFileType,
                                                            )}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        {formatFileSize(file.size)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        {file.dateAdded.toLocaleString()}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        {getTransferStatusIcon(file.transferStatus)}
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                        >
                                                            {file.transferStatus === 'pending' &&
                                                                'Ready'}
                                                            {file.transferStatus ===
                                                                'transferring' && 'Transferring...'}
                                                            {file.transferStatus === 'completed' &&
                                                                'Completed'}
                                                            {file.transferStatus === 'failed' &&
                                                                'Failed'}
                                                        </Typography>
                                                    </Box>
                                                    {file.transferError && (
                                                        <Tooltip title={file.transferError}>
                                                            <Typography
                                                                variant="caption"
                                                                color="error"
                                                            >
                                                                Error details
                                                            </Typography>
                                                        </Tooltip>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        {getImportStatusIcon(file.importStatus)}
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                        >
                                                            {file.importStatus === 'pending' &&
                                                                'Ready'}
                                                            {file.importStatus === 'importing' &&
                                                                'Importing...'}
                                                            {file.importStatus === 'completed' &&
                                                                'Completed'}
                                                            {file.importStatus === 'failed' &&
                                                                'Failed'}
                                                        </Typography>
                                                    </Box>
                                                    {file.importResult &&
                                                        !file.importResult.success && (
                                                            <Tooltip
                                                                title={file.importResult.message}
                                                            >
                                                                <Typography
                                                                    variant="caption"
                                                                    color="error"
                                                                >
                                                                    Error details
                                                                </Typography>
                                                            </Tooltip>
                                                        )}
                                                    {file.importResult &&
                                                        file.importResult.success && (
                                                            <Typography
                                                                variant="caption"
                                                                color="success.main"
                                                            >
                                                                {file.importResult.recordsInserted}{' '}
                                                                added,{' '}
                                                                {file.importResult.recordsUpdated}{' '}
                                                                updated
                                                            </Typography>
                                                        )}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Tooltip title="Delete file">
                                                        <IconButton
                                                            color="error"
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteFile(file.id);
                                                            }}
                                                            disabled={transferring || importing}
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                                {importedFiles.length > 0 && (
                                    <TableFooter>
                                        <TableRow>
                                            <TableCell colSpan={9}>
                                                <Box
                                                    display="flex"
                                                    justifyContent="space-between"
                                                    alignItems="center"
                                                    py={1}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        Total: {importedFiles.length} files
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        Total size:{' '}
                                                        {formatFileSize(
                                                            importedFiles.reduce(
                                                                (acc, file) => acc + file.size,
                                                                0,
                                                            ),
                                                        )}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    </TableFooter>
                                )}
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                </Box>
            </Container>

            {/* Template Download Menu */}
            <Menu
                anchorEl={templateMenuAnchor}
                open={Boolean(templateMenuAnchor)}
                onClose={handleTemplateMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <MenuItem onClick={() => handleTemplateDownload('product')}>
                    <ListItemIcon>
                        <Inventory fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Product Template" 
                        secondary="Excel template for product data import"
                    />
                </MenuItem>
                <MenuItem onClick={() => handleTemplateDownload('location')}>
                    <ListItemIcon>
                        <Business fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Location Template" 
                        secondary="Excel template for location data import"
                    />
                </MenuItem>
                <MenuItem onClick={() => handleTemplateDownload('staff')}>
                    <ListItemIcon>
                        <Group fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Staff Template" 
                        secondary="Excel template for staff data import"
                    />
                </MenuItem>
                <MenuItem onClick={() => handleTemplateDownload('supplier')}>
                    <ListItemIcon>
                        <Assignment fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Supplier Template" 
                        secondary="Excel template for supplier data import"
                    />
                </MenuItem>
            </Menu>

            {/* Error Snackbar */}
            <Snackbar
                open={!!error}
                autoHideDuration={2000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            {/* Success Snackbar */}
            <Snackbar
                open={!!success}
                autoHideDuration={2000}
                onClose={handleCloseSuccess}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
                    {success}
                </Alert>
            </Snackbar>
        </>
    );
};