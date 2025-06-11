// src/presentation/pages/ImportPage.tsx
import React, { useState, useRef, useEffect } from 'react';
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
  ListItemIcon
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
  Refresh
} from '@mui/icons-material';
import { AndroidDevice } from '@/domain/entities/AndroidDevice';
import { FileTransferResult } from '@/domain/entities/FileTransferResult';
import { DIContainer } from '@/application/services/DIContainer';
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
  tempFilePath?: string; // Store temporary file path for cleanup
}

interface TransferProgress {
  currentFile: number;
  totalFiles: number;
  currentFileName: string;
  overallProgress: number;
}

interface ImportPageProps {
  connectedDevice?: AndroidDevice | null;
}

export const ImportPage: React.FC<ImportPageProps> = ({ connectedDevice }) => {
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [transferring, setTransferring] = useState<boolean>(false);
  const [transferProgress, setTransferProgress] = useState<TransferProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importPath, setImportPath] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const androidDeviceService = DIContainer.getInstance().getAndroidDeviceService();
  const settingService = DIContainer.getInstance().getSettingService();

  const ALLOWED_TYPES = [
    '.csv',
    '.xlsx',
    '.xls',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];

  useEffect(() => {
    loadImportPath();
    
    // Cleanup any temporary files when component unmounts
    return () => {
      cleanupAllTemporaryFiles();
    };
  }, []);

  const loadImportPath = async () => {
    try {
      const path = await settingService.getSettingValue(SETTING_KEYS.FILE_IMPORT_PATH);
      setImportPath(path || '/sdcard/Downloads');
    } catch (error) {
      console.error('Failed to load import path:', error);
      setImportPath('/sdcard/Downloads'); // Default fallback
    }
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

  const isValidFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return ALLOWED_TYPES.includes(extension) || ALLOWED_TYPES.includes(file.type);
  };

  // Create temporary file using the main process file system API
  const createTemporaryFile = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const tempPath = await window.electronAPI.fs.writeTemporaryFile(file.name, arrayBuffer);
      console.log(`Temporary file created at: ${tempPath}`);
      return tempPath;
    } catch (error) {
      console.error('Failed to create temporary file:', error);
      throw new Error(`Failed to create temporary file for ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Clean up a single temporary file
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

  // Clean up all temporary files stored in the imported files
  const cleanupAllTemporaryFiles = async (): Promise<void> => {
    const filesToCleanup = importedFiles.filter(file => file.tempFilePath);
    
    for (const file of filesToCleanup) {
      if (file.tempFilePath) {
        await cleanupTemporaryFile(file.tempFilePath);
      }
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    const validFiles = files.filter(isValidFile);

    const newImportedFiles: ImportedFile[] = validFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: getFileTypeLabel(file),
      dateAdded: new Date(),
      file,
      transferStatus: 'pending'
    }));

    setImportedFiles(prev => [...prev, ...newImportedFiles]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedFiles(new Set(importedFiles.map(file => file.id)));
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
    const fileToDelete = importedFiles.find(file => file.id === fileId);
    
    // Clean up temporary file if it exists
    if (fileToDelete?.tempFilePath) {
      await cleanupTemporaryFile(fileToDelete.tempFilePath);
    }
    
    setImportedFiles(prev => prev.filter(file => file.id !== fileId));
    setSelectedFiles(prev => {
      const newSelected = new Set(prev);
      newSelected.delete(fileId);
      return newSelected;
    });
  };

  const handleDeleteSelected = async () => {
    const filesToDelete = importedFiles.filter(file => selectedFiles.has(file.id));
    
    // Clean up temporary files for selected files
    for (const file of filesToDelete) {
      if (file.tempFilePath) {
        await cleanupTemporaryFile(file.tempFilePath);
      }
    }
    
    setImportedFiles(prev => prev.filter(file => !selectedFiles.has(file.id)));
    setSelectedFiles(new Set());
  };

  const handleClearAll = async () => {
    // Clean up all temporary files
    await cleanupAllTemporaryFiles();
    
    setImportedFiles([]);
    setSelectedFiles(new Set());
  };

  const handleImportToDevice = async () => {
    if (!connectedDevice) {
      setError('No device connected. Please connect an Android device first.');
      return;
    }

    if (importedFiles.length === 0) {
      setError('No files to transfer. Please import some files first.');
      return;
    }

    setTransferring(true);
    setError(null);
    setSuccess(null);

    const filesToTransfer = selectedFiles.size > 0 
      ? importedFiles.filter(file => selectedFiles.has(file.id))
      : importedFiles;

    if (filesToTransfer.length === 0) {
      setError('No files selected for transfer.');
      setTransferring(false);
      return;
    }

    let successCount = 0;
    let failureCount = 0;
    const createdTempFiles: string[] = [];

    try {
      for (let i = 0; i < filesToTransfer.length; i++) {
        const file = filesToTransfer[i];
        
        setTransferProgress({
          currentFile: i + 1,
          totalFiles: filesToTransfer.length,
          currentFileName: file.name,
          overallProgress: Math.round(((i) / filesToTransfer.length) * 100)
        });

        // Update file status to transferring
        setImportedFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, transferStatus: 'transferring' as const } : f
        ));

        try {
          // Create temporary file from the File object
          const tempPath = await createTemporaryFile(file.file);
          createdTempFiles.push(tempPath);
          
          // Store temp file path for later cleanup
          setImportedFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, tempFilePath: tempPath } : f
          ));
          
          // Transfer file to device
          const remotePath = `${importPath}/${file.name}`;
          const result: FileTransferResult = await androidDeviceService.uploadFile(
            connectedDevice.id,
            tempPath,
            remotePath
          );

          if (result.success) {
            successCount++;
            setImportedFiles(prev => prev.map(f => 
              f.id === file.id ? { ...f, transferStatus: 'completed' as const } : f
            ));
          } else {
            failureCount++;
            setImportedFiles(prev => prev.map(f => 
              f.id === file.id ? { 
                ...f, 
                transferStatus: 'failed' as const,
                transferError: result.error || result.message
              } : f
            ));
          }
        } catch (err) {
          failureCount++;
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setImportedFiles(prev => prev.map(f => 
            f.id === file.id ? { 
              ...f, 
              transferStatus: 'failed' as const,
              transferError: errorMessage
            } : f
          ));
        }
      }

      // Final progress update
      setTransferProgress({
        currentFile: filesToTransfer.length,
        totalFiles: filesToTransfer.length,
        currentFileName: '',
        overallProgress: 100
      });

      // Show final results
      if (successCount > 0 && failureCount === 0) {
        setSuccess(`Successfully transferred ${successCount} files to ${connectedDevice.model || connectedDevice.serialNumber}`);
      } else if (successCount > 0 && failureCount > 0) {
        setError(`Transfer completed with mixed results: ${successCount} successful, ${failureCount} failed`);
      } else {
        setError(`Transfer failed: ${failureCount} files could not be transferred`);
      }
    } finally {
      // Clean up all created temporary files
      for (const tempPath of createdTempFiles) {
        await cleanupTemporaryFile(tempPath);
      }
      
      // Clear temp file paths from state
      setImportedFiles(prev => prev.map(f => ({ ...f, tempFilePath: undefined })));

      setTimeout(() => {
        setTransferring(false);
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
            Import CSV and Excel files for processing and transfer to Android devices.
          </Typography>

          {/* Transfer Progress */}
          {transferProgress && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <CloudUpload sx={{ color: 'primary.main' }} />
                  <Typography variant="h6">
                    Transferring Files to {connectedDevice?.model || connectedDevice?.serialNumber}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" mb={1}>
                  File {transferProgress.currentFile} of {transferProgress.totalFiles}: {transferProgress.currentFileName}
                </Typography>
                
                <LinearProgress 
                  variant="determinate" 
                  value={transferProgress.overallProgress} 
                  sx={{ mb: 1 }}
                />
                
                <Typography variant="caption" color="text.secondary">
                  {transferProgress.overallProgress}% complete
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Device Status Display */}
          {connectedDevice && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <CheckCircle sx={{ color: 'success.main' }} />
                  <Typography variant="h6">
                    Ready to transfer to {connectedDevice.model || connectedDevice.serialNumber}
                  </Typography>
                  <Chip 
                    label={`Target: ${importPath}`} 
                    size="small" 
                    variant="outlined" 
                  />
                </Box>
              </CardContent>
            </Card>
          )}

          {/* File Selection Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    File Selection
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select CSV or Excel files from your computer
                  </Typography>
                </Box>
                
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Button
                    variant="contained"
                    startIcon={<Upload />}
                    onClick={handleFileSelect}
                    disabled={transferring}
                  >
                    Select Files
                  </Button>

                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={transferring ? <CircularProgress size={20} /> : <CloudUpload />}
                    onClick={handleImportToDevice}
                    disabled={!connectedDevice || importedFiles.length === 0 || transferring}
                  >
                    {transferring ? 'Transferring...' : 'Import to Device'}
                  </Button>
                  
                  {selectedFiles.size > 0 && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Delete />}
                      onClick={handleDeleteSelected}
                      disabled={transferring}
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
                      disabled={transferring}
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
                    label={`${selectedFiles.size} selected for transfer`} 
                    size="small" 
                    color="secondary"
                    variant="outlined"
                  />
                )}
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
                        disabled={importedFiles.length === 0 || transferring}
                      />
                    </TableCell>
                    <TableCell>File</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Size</TableCell>
                    <TableCell>Date Added</TableCell>
                    <TableCell>Transfer Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importedFiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Box py={4}>
                          <InsertDriveFile sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                          <Typography variant="body1" color="text.secondary">
                            No files imported yet
                          </Typography>
                          <Typography variant="body2" color="text.disabled">
                            Click "Select Files" to import CSV or Excel files
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
                        onClick={() => !transferring && handleSelectFile(file.id)}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedFiles.has(file.id)}
                            onChange={() => handleSelectFile(file.id)}
                            disabled={transferring}
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {getFileTypeIcon(file.file.type)}
                            <Box ml={1}>
                              <Typography variant="body2" fontWeight="medium">
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
                            color={file.type === 'CSV' ? 'success' : 'primary'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            {formatFileSize(file.size)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {file.dateAdded.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getTransferStatusIcon(file.transferStatus)}
                            <Typography variant="body2" color="text.secondary">
                              {file.transferStatus === 'pending' && 'Ready'}
                              {file.transferStatus === 'transferring' && 'Transferring...'}
                              {file.transferStatus === 'completed' && 'Completed'}
                              {file.transferStatus === 'failed' && 'Failed'}
                            </Typography>
                          </Box>
                          {file.transferError && (
                            <Tooltip title={file.transferError}>
                              <Typography variant="caption" color="error">
                                Error details
                              </Typography>
                            </Tooltip>
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
                              disabled={transferring}
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
                      <TableCell colSpan={7}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" py={1}>
                          <Typography variant="body2" color="text.secondary">
                            Total: {importedFiles.length} files
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total size: {formatFileSize(importedFiles.reduce((acc, file) => acc + file.size, 0))}
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

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
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