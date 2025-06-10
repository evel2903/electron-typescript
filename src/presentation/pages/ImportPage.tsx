// src/presentation/pages/ImportPage.tsx
import React, { useState, useRef } from 'react';
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
  Tooltip
} from '@mui/material';
import {
  Upload,
  Delete,
  Clear,
  InsertDriveFile,
  TableChart,
  Description
} from '@mui/icons-material';

interface ImportedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dateAdded: Date;
  file: File;
}

export const ImportPage: React.FC = () => {
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = [
    '.csv',
    '.xlsx',
    '.xls',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];

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

  const isValidFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return ALLOWED_TYPES.includes(extension) || ALLOWED_TYPES.includes(file.type);
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
      file
    }));

    setImportedFiles(prev => [...prev, ...newImportedFiles]);
    
    // Reset file input
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

  const handleDeleteFile = (fileId: string) => {
    setImportedFiles(prev => prev.filter(file => file.id !== fileId));
    setSelectedFiles(prev => {
      const newSelected = new Set(prev);
      newSelected.delete(fileId);
      return newSelected;
    });
  };

  const handleDeleteSelected = () => {
    setImportedFiles(prev => prev.filter(file => !selectedFiles.has(file.id)));
    setSelectedFiles(new Set());
  };

  const handleClearAll = () => {
    setImportedFiles([]);
    setSelectedFiles(new Set());
  };

  const isAllSelected = importedFiles.length > 0 && selectedFiles.size === importedFiles.length;
  const isSomeSelected = selectedFiles.size > 0 && selectedFiles.size < importedFiles.length;

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          Import Files
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Import CSV and Excel files for processing.
        </Typography>

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
                >
                  Select Files
                </Button>
                
                {selectedFiles.size > 0 && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={handleDeleteSelected}
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
                  >
                    Clear All
                  </Button>
                )}
              </Box>
            </Box>

            {/* File Info */}
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
                      disabled={importedFiles.length === 0}
                    />
                  </TableCell>
                  <TableCell>File</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Size</TableCell>
                  <TableCell>Date Added</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {importedFiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
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
                      onClick={() => handleSelectFile(file.id)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedFiles.has(file.id)}
                          onChange={() => handleSelectFile(file.id)}
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
                      <TableCell align="center">
                        <Tooltip title="Delete file">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(file.id);
                            }}
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
                    <TableCell colSpan={6}>
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
  );
};