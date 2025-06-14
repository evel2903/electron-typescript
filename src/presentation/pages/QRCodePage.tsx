// src/presentation/pages/QRCodePage.tsx
import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Button,
    CircularProgress,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Chip,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TablePagination,
    Divider,
} from '@mui/material';
import {
    QrCode,
    Print,
    Refresh,
    FilterList,
    Inventory,
    Business,
    Group,
    Assignment,
    CheckCircle,
    Error as ErrorIcon,
    Preview,
} from '@mui/icons-material';
import { Product } from '@/domain/entities/Product';
import { Location } from '@/domain/entities/Location';
import { Staff } from '@/domain/entities/Staff';
import { Supplier } from '@/domain/entities/Supplier';
import { RendererDataService } from '@/application/services/DIContainer';
import QRCodeSVG from 'react-qr-code';

type EntityType = 'product' | 'supplier' | 'staff' | 'shop';

interface QRCodeItem {
    id: string;
    code: string;
    name: string;
    selected: boolean;
}

export const QRCodePage: React.FC = () => {
    const [selectedEntity, setSelectedEntity] = useState<EntityType>('product');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchFilter, setSearchFilter] = useState<string>('');
    
    // Data states
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [shops, setShops] = useState<Location[]>([]);
    
    // QR Code states
    const [qrItems, setQrItems] = useState<QRCodeItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [previewDialogOpen, setPreviewDialogOpen] = useState<boolean>(false);
    const [generating, setGenerating] = useState<boolean>(false);
    
    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const dataService = RendererDataService.getInstance();

    useEffect(() => {
        loadAllData();
    }, []);

    useEffect(() => {
        updateQRItems();
        // Clear QR code data when entity changes
        setSelectedItems(new Set());
    }, [selectedEntity, products, suppliers, staff, shops, searchFilter]);

    const loadAllData = async () => {
        setLoading(true);
        setError(null);

        try {
            const [productsData, suppliersData, staffData, shopsData] = await Promise.all([
                dataService.getProducts(),
                dataService.getSuppliers(),
                dataService.getStaff(),
                dataService.getLocations(),
            ]);

            setProducts(productsData);
            setSuppliers(suppliersData);
            setStaff(staffData);
            setShops(shopsData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const updateQRItems = () => {
        let items: QRCodeItem[] = [];

        switch (selectedEntity) {
            case 'product':
                items = products.map(item => ({
                    id: item.janCode,
                    code: item.janCode,
                    name: item.productName,
                    selected: false,
                }));
                break;
            case 'supplier':
                items = suppliers.map(item => ({
                    id: item.supplierCode,
                    code: item.supplierCode,
                    name: item.supplierName,
                    selected: false,
                }));
                break;
            case 'staff':
                items = staff.map(item => ({
                    id: item.staffCode,
                    code: item.staffCode,
                    name: item.staffName,
                    selected: false,
                }));
                break;
            case 'shop':
                items = shops.map(item => ({
                    id: item.shopCode,
                    code: item.shopCode,
                    name: item.shopName,
                    selected: false,
                }));
                break;
        }

        // Apply search filter
        if (searchFilter) {
            items = items.filter(item =>
                item.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
                item.name.toLowerCase().includes(searchFilter.toLowerCase())
            );
        }

        setQrItems(items);
        setSelectedItems(new Set());
        setPage(0);
    };

    const handleEntityChange = (entity: EntityType) => {
        setSelectedEntity(entity);
        setSelectedItems(new Set());
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedItems(new Set(qrItems.map(item => item.id)));
        } else {
            setSelectedItems(new Set());
        }
    };

    const handleSelectItem = (itemId: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
        }
        setSelectedItems(newSelected);
    };

    const handlePreview = async () => {
        if (selectedItems.size === 0) {
            setError('Please select at least one item to preview');
            return;
        }
        setPreviewDialogOpen(true);
    };

    const handleClosePreview = () => {
        setPreviewDialogOpen(false);
    };

    const handlePrint = () => {
        if (qrItems.filter(item => selectedItems.has(item.id)).length === 0) {
            setError('No QR codes to print');
            return;
        }

        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            setError('Unable to open print window. Please check your browser settings.');
            return;
        }

        // Generate HTML content for printing
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR Code Print - ${selectedEntity.charAt(0).toUpperCase() + selectedEntity.slice(1)}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        background: white;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 10px;
                    }
                    .qr-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 20px;
                        margin-top: 20px;
                    }
                    .qr-item {
                        border: 1px solid #ddd;
                        padding: 15px;
                        text-align: center;
                        border-radius: 8px;
                        background: #f9f9f9;
                        page-break-inside: avoid;
                    }
                    .qr-code {
                        margin-bottom: 10px;
                    }
                    .qr-code img {
                        max-width: 150px;
                        height: auto;
                    }
                    .qr-info {
                        margin-top: 10px;
                    }
                    .qr-code-text {
                        font-size: 14px;
                        font-weight: bold;
                        color: #333;
                        margin-bottom: 5px;
                    }
                    .qr-name {
                        font-size: 12px;
                        color: #666;
                        word-wrap: break-word;
                    }
                    @media print {
                        body {
                            margin: 0;
                        }
                        .qr-grid {
                            grid-template-columns: repeat(3, 1fr);
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>QR Code Print Sheet</h1>
                    <p>Entity Type: ${selectedEntity.charAt(0).toUpperCase() + selectedEntity.slice(1)} | Total Items: ${qrItems.filter(item => selectedItems.has(item.id)).length} | Generated: ${new Date().toLocaleString()}</p>
                </div>
                
                <div class="qr-grid">
                    ${qrItems.filter(item => selectedItems.has(item.id)).map(item => `
                        <div class="qr-item">
                            <div class="qr-code">
                                <QRCodeSVG value="${item.code} - ${item.name}" size={150} />
                            </div>
                            <div class="qr-info">
                                <div class="qr-code-text">${item.code}</div>
                                <div class="qr-name">${item.name}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();

        // Wait for images to load before printing
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
            setSuccess(`Successfully printed ${qrItems.filter(item => selectedItems.has(item.id)).length} QR codes`);
            setPreviewDialogOpen(false);
        }, 1000);
    };

    const getEntityIcon = (entity: EntityType) => {
        switch (entity) {
            case 'product':
                return <Inventory sx={{ color: '#2196f3' }} />;
            case 'supplier':
                return <Assignment sx={{ color: '#f44336' }} />;
            case 'staff':
                return <Group sx={{ color: '#9c27b0' }} />;
            case 'shop':
                return <Business sx={{ color: '#ff9800' }} />;
        }
    };

    const getEntityDisplayName = (entity: EntityType): string => {
        switch (entity) {
            case 'product':
                return 'Products';
            case 'supplier':
                return 'Suppliers';
            case 'staff':
                return 'Staff';
            case 'shop':
                return 'Shops/Locations';
        }
    };

    const handleCloseError = () => {
        setError(null);
    };

    const handleCloseSuccess = () => {
        setSuccess(null);
    };

    const filteredItems = qrItems;
    const paginatedItems = filteredItems.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage,
    );

    const isAllSelected = filteredItems.length > 0 && selectedItems.size === filteredItems.length;
    const isSomeSelected = selectedItems.size > 0 && selectedItems.size < filteredItems.length;

    return (
        <>
            <Container maxWidth="xl">
                <Box py={4}>
                    {/* Header */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
                        <Box display="flex" alignItems="center">
                            <QrCode sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
                            <Typography variant="h3" component="h1">
                                QR Code Printing
                            </Typography>
                        </Box>

                        <Box display="flex" gap={2}>
                            <Button
                                variant="outlined"
                                startIcon={<Refresh />}
                                onClick={loadAllData}
                                disabled={loading}
                            >
                                Refresh Data
                            </Button>
                        </Box>
                    </Box>

                    <Typography variant="body1" color="text.secondary" paragraph>
                        Generate and print QR codes for your master data records. Select the entity type and specific records to create QR codes containing the code and name information.
                    </Typography>

                    {/* Entity Selection */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Select Data Type
                            </Typography>
                            
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth>
                                        <InputLabel>Entity Type</InputLabel>
                                        <Select
                                            value={selectedEntity}
                                            onChange={(e) => handleEntityChange(e.target.value as EntityType)}
                                            label="Entity Type"
                                        >
                                            <MenuItem value="product">
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Inventory fontSize="small" />
                                                    Products
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="supplier">
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Assignment fontSize="small" />
                                                    Suppliers
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="staff">
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Group fontSize="small" />
                                                    Staff
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="shop">
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Business fontSize="small" />
                                                    Shops/Locations
                                                </Box>
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Search"
                                        value={searchFilter}
                                        onChange={(e) => setSearchFilter(e.target.value)}
                                        placeholder="Filter by code or name"
                                        InputProps={{
                                            startAdornment: <FilterList sx={{ mr: 1, color: 'text.secondary' }} />
                                        }}
                                    />
                                </Grid>
                                
                                <Grid item xs={12} md={5}>
                                    <Box display="flex" gap={1} flexWrap="wrap" alignItems="center" height="100%">
                                        <Chip
                                            icon={getEntityIcon(selectedEntity)}
                                            label={`${getEntityDisplayName(selectedEntity)}: ${filteredItems.length} items`}
                                            color="primary"
                                            variant="outlined"
                                        />
                                        {selectedItems.size > 0 && (
                                            <Chip
                                                label={`${selectedItems.size} selected`}
                                                color="secondary"
                                                variant="outlined"
                                            />
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                                <Typography variant="h6">
                                    QR Code Generation
                                </Typography>
                                
                                <Box display="flex" gap={2}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Preview />}
                                        onClick={handlePreview}
                                        disabled={selectedItems.size === 0 || generating}
                                    >
                                        {generating ? 'Generating...' : 'Preview QR Codes'}
                                    </Button>
                                    
                                    <Button
                                        variant="contained"
                                        startIcon={<Print />}
                                        onClick={handlePreview}
                                        disabled={selectedItems.size === 0 || generating}
                                    >
                                        Generate & Print
                                    </Button>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Error Display */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <Box display="flex" justifyContent="center" py={4}>
                            <CircularProgress size={40} />
                        </Box>
                    )}

                    {/* Data Table */}
                    {!loading && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {getEntityDisplayName(selectedEntity)} List ({filteredItems.length} items)
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                
                                <TableContainer component={Paper} elevation={1}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        indeterminate={isSomeSelected}
                                                        checked={isAllSelected}
                                                        onChange={handleSelectAll}
                                                        disabled={filteredItems.length === 0}
                                                    />
                                                </TableCell>
                                                <TableCell><strong>Code</strong></TableCell>
                                                <TableCell><strong>Name</strong></TableCell>
                                                <TableCell><strong>Status</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedItems.map((item) => (
                                                <TableRow 
                                                    key={item.id} 
                                                    hover 
                                                    selected={selectedItems.has(item.id)}
                                                    onClick={() => handleSelectItem(item.id)}
                                                    sx={{ cursor: 'pointer' }}
                                                >
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            checked={selectedItems.has(item.id)}
                                                            onChange={() => handleSelectItem(item.id)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {item.code}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {item.name}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {selectedItems.has(item.id) ? (
                                                            <Chip
                                                                icon={<CheckCircle />}
                                                                label="Selected"
                                                                size="small"
                                                                color="success"
                                                            />
                                                        ) : (
                                                            <Chip
                                                                label="Not Selected"
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                
                                <TablePagination
                                    rowsPerPageOptions={[10, 25, 50, 100]}
                                    component="div"
                                    count={filteredItems.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={(_, newPage) => setPage(newPage)}
                                    onRowsPerPageChange={(e) => {
                                        setRowsPerPage(parseInt(e.target.value, 10));
                                        setPage(0);
                                    }}
                                />
                            </CardContent>
                        </Card>
                    )}
                </Box>
            </Container>

            {/* Preview Dialog */}
            <Dialog 
                open={previewDialogOpen} 
                onClose={handleClosePreview} 
                maxWidth="lg" 
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        QR Code Preview
                        <Typography variant="subtitle1" color="text.secondary">
                            {qrItems.filter(item => selectedItems.has(item.id)).length} QR codes generated
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {qrItems.filter(item => selectedItems.has(item.id)).map((item) => (
                            <Grid item xs={12} sm={6} md={4} key={item.id}>
                                <Card sx={{ m: 1, width: 220, display: 'inline-block', verticalAlign: 'top' }}>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <QRCodeSVG value={item.code + ' - ' + item.name} size={128} />
                                        <Typography variant="subtitle2" sx={{ mt: 1 }}>
                                            QR Code for
                                        </Typography>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {item.code}
                                        </Typography>
                                        <Typography variant="body2">{item.name}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClosePreview}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handlePrint} 
                        variant="contained" 
                        startIcon={<Print />}
                    >
                        Print QR Codes
                    </Button>
                </DialogActions>
            </Dialog>

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
        </>
    );
};