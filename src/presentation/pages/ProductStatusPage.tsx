// src/presentation/pages/ProductStatusPage.tsx - Enhanced with Excel export functionality
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
    Chip,
    Alert,
    IconButton,
    Tooltip,
    TablePagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    Divider,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
} from '@mui/material';
import {
    Category,
    Refresh,
    FilterList,
    Visibility,
    Close,
    Edit,
    Warning,
    CheckCircle,
    Error as ErrorIcon,
    GetApp,
} from '@mui/icons-material';
import { Product } from '@/domain/entities/Product';
import { RendererDataService } from '@/application/services/DIContainer';

type ProductStatus = 'Normal' | 'Low Stock' | 'Overstocked' | 'Critical' | 'No Alert Set';

interface ProductWithStatus extends Product {
    status: ProductStatus;
    statusColor: 'success' | 'warning' | 'error' | 'default';
}

export const ProductStatusPage: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<ProductWithStatus[]>([]);

    // Pagination states
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Detail dialog state
    const [detailDialog, setDetailDialog] = useState<{
        open: boolean;
        product: ProductWithStatus | null;
    }>({ open: false, product: null });

    // Filter states
    const [filters, setFilters] = useState<{
        productCode: string;
        productName: string;
        supplierCode: string;
        status: string;
    }>({ productCode: '', productName: '', supplierCode: '', status: '' });

    const dataService = RendererDataService.getInstance();

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        applyFiltersAndCalculateStatus();
    }, [products, filters]);

    const loadProducts = async () => {
        setLoading(true);
        setError(null);

        try {
            const productData = await dataService.getProducts();
            setProducts(productData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load product data');
        } finally {
            setLoading(false);
        }
    };

    const calculateProductStatus = (product: Product): { status: ProductStatus; color: 'success' | 'warning' | 'error' | 'default' } => {
        const { boxQuantity, stockInAlert, stockOutAlert } = product;

        // If no alerts are set, return default status
        if (stockInAlert === 0 && stockOutAlert === 0) {
            return { status: 'No Alert Set', color: 'default' };
        }

        // Critical: Stock is at or below the critical threshold
        if (stockOutAlert > 0 && boxQuantity <= stockOutAlert) {
            return { status: 'Critical', color: 'error' };
        }

        // Low Stock: Stock is below normal but above critical
        if (stockOutAlert > 0 && boxQuantity <= (stockOutAlert * 1.5)) {
            return { status: 'Low Stock', color: 'warning' };
        }

        // Overstocked: Stock exceeds the maximum threshold
        if (stockInAlert > 0 && boxQuantity >= stockInAlert) {
            return { status: 'Overstocked', color: 'warning' };
        }

        // Normal: Stock is within acceptable range
        return { status: 'Normal', color: 'success' };
    };

    const applyFiltersAndCalculateStatus = () => {
        let filtered = products;

        // Apply filters
        if (filters.productCode) {
            filtered = filtered.filter(product =>
                product.janCode.toLowerCase().includes(filters.productCode.toLowerCase()) ||
                product.productName.toLowerCase().includes(filters.productCode.toLowerCase())
            );
        }

        if (filters.productName) {
            filtered = filtered.filter(product =>
                product.productName.toLowerCase().includes(filters.productName.toLowerCase())
            );
        }

        if (filters.supplierCode) {
            filtered = filtered.filter(product =>
                product.supplierCode.toLowerCase().includes(filters.supplierCode.toLowerCase())
            );
        }

        // Calculate status for each product
        const productsWithStatus: ProductWithStatus[] = filtered.map(product => {
            const { status, color } = calculateProductStatus(product);
            return {
                ...product,
                status,
                statusColor: color,
            };
        });

        // Apply status filter
        if (filters.status) {
            const statusFiltered = productsWithStatus.filter(product =>
                product.status === filters.status
            );
            setFilteredProducts(statusFiltered);
        } else {
            setFilteredProducts(productsWithStatus);
        }

        // Reset pagination when filters change
        setPage(0);
    };

    const handleRefresh = () => {
        loadProducts();
    };

    const handleDownloadExcel = () => {
        try {
            const XLSX = require('xlsx');
            
            // Prepare comprehensive data for Excel export including summary information
            const summaryData = [
                ['Product Status Report'],
                ['Generated Date:', new Date().toLocaleString()],
                ['Total Products:', filteredProducts.length.toString()],
                ['Normal Status:', statusCounts.normal.toString()],
                ['Low Stock:', statusCounts.lowStock.toString()],
                ['Critical:', statusCounts.critical.toString()],
                ['Overstocked:', statusCounts.overstocked.toString()],
                ['No Alert Set:', statusCounts.noAlert.toString()],
                [], // Empty row for spacing
                ['Filters Applied:'],
                ['Product Code Filter:', filters.productCode || 'None'],
                ['Product Name Filter:', filters.productName || 'None'],
                ['Supplier Code Filter:', filters.supplierCode || 'None'],
                ['Status Filter:', filters.status || 'All Status'],
                [], // Empty row for spacing
                ['Product Details:'],
            ];

            // Prepare detailed product data
            const productData = filteredProducts.map((product, index) => ({
                'No.': index + 1,
                'JAN Code': product.janCode,
                'Product Name': product.productName,
                'Supplier Code': product.supplierCode || '',
                'Box Quantity': product.boxQuantity,
                'Stock In Alert Threshold': product.stockInAlert,
                'Stock Out Alert Threshold': product.stockOutAlert,
                'Current Status': product.status,
                'Status Explanation': getStatusExplanation(product),
                'Created Date': product.createdAt.toLocaleDateString(),
                'Last Updated': product.updatedAt.toLocaleDateString(),
            }));

            // Create workbook with multiple sheets
            const workbook = XLSX.utils.book_new();

            // Summary sheet
            const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

            // Product details sheet
            const productWorksheet = XLSX.utils.json_to_sheet(productData);
            
            // Set column widths for better readability
            const columnWidths = [
                { wch: 5 },   // No.
                { wch: 15 },  // JAN Code
                { wch: 35 },  // Product Name
                { wch: 15 },  // Supplier Code
                { wch: 12 },  // Box Quantity
                { wch: 18 },  // Stock In Alert
                { wch: 18 },  // Stock Out Alert
                { wch: 15 },  // Status
                { wch: 40 },  // Status Explanation
                { wch: 15 },  // Created Date
                { wch: 15 },  // Last Updated
            ];
            productWorksheet['!cols'] = columnWidths;

            XLSX.utils.book_append_sheet(workbook, productWorksheet, 'Product Details');

            // Generate filename with current date and time
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `Product_Status_Report_${timestamp}.xlsx`;

            // Save the file
            XLSX.writeFile(workbook, filename);

            setSuccess(`Excel file exported successfully: ${filename} (${filteredProducts.length} products included)`);
        } catch (error) {
            console.error('Failed to export Excel file:', error);
            setError('Failed to export Excel file. Please verify system permissions and try again.');
        }
    };

    const getStatusExplanation = (product: ProductWithStatus): string => {
        const { boxQuantity, stockInAlert, stockOutAlert, status } = product;
        
        switch (status) {
            case 'Critical':
                return `Stock level (${boxQuantity}) is at or below critical threshold (${stockOutAlert})`;
            case 'Low Stock':
                return `Stock level (${boxQuantity}) is below optimal range, approaching critical threshold (${stockOutAlert})`;
            case 'Normal':
                return `Stock level (${boxQuantity}) is within optimal range (${stockOutAlert} - ${stockInAlert})`;
            case 'Overstocked':
                return `Stock level (${boxQuantity}) exceeds maximum threshold (${stockInAlert})`;
            case 'No Alert Set':
                return 'No alert thresholds configured for monitoring';
            default:
                return 'Status evaluation unavailable';
        }
    };

    const handleCloseError = () => {
        setError(null);
    };

    const handleCloseSuccess = () => {
        setSuccess(null);
    };

    const openDetailDialog = (product: ProductWithStatus) => {
        setDetailDialog({ open: true, product });
    };

    const closeDetailDialog = () => {
        setDetailDialog({ open: false, product: null });
    };

    const getStatusCounts = () => {
        const counts = {
            total: filteredProducts.length,
            normal: 0,
            lowStock: 0,
            overstocked: 0,
            critical: 0,
            noAlert: 0,
        };

        filteredProducts.forEach(product => {
            switch (product.status) {
                case 'Normal':
                    counts.normal++;
                    break;
                case 'Low Stock':
                    counts.lowStock++;
                    break;
                case 'Overstocked':
                    counts.overstocked++;
                    break;
                case 'Critical':
                    counts.critical++;
                    break;
                case 'No Alert Set':
                    counts.noAlert++;
                    break;
            }
        });

        return counts;
    };

    const statusCounts = getStatusCounts();
    const paginatedProducts = filteredProducts.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const renderDetailDialog = () => {
        const { open, product } = detailDialog;
        if (!open || !product) return null;

        const detailFields = [
            { label: 'JAN Code', value: product.janCode },
            { label: 'Product Name', value: product.productName },
            { label: 'Supplier Code', value: product.supplierCode || 'N/A' },
            { label: 'Box Quantity', value: product.boxQuantity.toLocaleString() },
            { label: 'Stock In Alert Threshold', value: product.stockInAlert.toLocaleString() },
            { label: 'Stock Out Alert Threshold', value: product.stockOutAlert.toLocaleString() },
            { label: 'Current Status', value: product.status },
            { label: 'Created Date', value: product.createdAt.toLocaleDateString() },
            { label: 'Last Updated', value: product.updatedAt.toLocaleDateString() },
        ];

        return (
            <Dialog open={open} onClose={closeDetailDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        Product Details
                        <IconButton onClick={closeDetailDialog}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <List>
                        {detailFields.map((field, index) => (
                            <React.Fragment key={index}>
                                <ListItem>
                                    <ListItemText
                                        primary={field.label}
                                        secondary={field.value}
                                        primaryTypographyProps={{ fontWeight: 'medium' }}
                                    />
                                </ListItem>
                                {index < detailFields.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDetailDialog}>Close</Button>
                </DialogActions>
            </Dialog>
        );
    };

    return (
        <>
            <Container maxWidth="xl">
                <Box py={4}>
                    {/* Header */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
                        <Box display="flex" alignItems="center">
                            <Category sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
                            <Typography variant="h3" component="h1">
                                Product Status Management
                            </Typography>
                        </Box>

                        <Box display="flex" gap={2}>
                            <Button
                                variant="outlined"
                                startIcon={<GetApp />}
                                onClick={handleDownloadExcel}
                                disabled={loading || filteredProducts.length === 0}
                            >
                                Download Excel
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<Refresh />}
                                onClick={handleRefresh}
                                disabled={loading}
                            >
                                Refresh Products
                            </Button>
                        </Box>
                    </Box>

                    <Typography variant="body1" color="text.secondary" paragraph>
                        Monitor product inventory status based on configured alert thresholds. 
                        View current stock levels and manage alert configurations for optimal inventory control.
                    </Typography>

                    {/* Summary Cards */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={2}>
                            <Card sx={{ bgcolor: '#e3f2fd' }}>
                                <CardContent>
                                    <Box textAlign="center">
                                        <Typography variant="h4" color="primary">
                                            {statusCounts.total.toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Products
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <Card sx={{ bgcolor: '#e8f5e8' }}>
                                <CardContent>
                                    <Box textAlign="center">
                                        <Typography variant="h4" color="success.main">
                                            {statusCounts.normal.toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Normal
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <Card sx={{ bgcolor: '#fff3e0' }}>
                                <CardContent>
                                    <Box textAlign="center">
                                        <Typography variant="h4" color="warning.main">
                                            {statusCounts.lowStock.toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Low Stock
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <Card sx={{ bgcolor: '#fce4ec' }}>
                                <CardContent>
                                    <Box textAlign="center">
                                        <Typography variant="h4" color="error.main">
                                            {statusCounts.critical.toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Critical
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <Card sx={{ bgcolor: '#fff3e0' }}>
                                <CardContent>
                                    <Box textAlign="center">
                                        <Typography variant="h4" color="warning.main">
                                            {statusCounts.overstocked.toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Overstocked
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <Card sx={{ bgcolor: '#f5f5f5' }}>
                                <CardContent>
                                    <Box textAlign="center">
                                        <Typography variant="h4" color="text.secondary">
                                            {statusCounts.noAlert.toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            No Alert Set
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Filters */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Filter Products
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={3}>
                                    <TextField
                                        fullWidth
                                        label="Product Code / JAN Code"
                                        value={filters.productCode}
                                        onChange={(e) =>
                                            setFilters({ ...filters, productCode: e.target.value })
                                        }
                                        size="small"
                                        placeholder="Filter by product code or name"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <TextField
                                        fullWidth
                                        label="Product Name"
                                        value={filters.productName}
                                        onChange={(e) =>
                                            setFilters({ ...filters, productName: e.target.value })
                                        }
                                        size="small"
                                        placeholder="Filter by product name"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <TextField
                                        fullWidth
                                        label="Supplier Code"
                                        value={filters.supplierCode}
                                        onChange={(e) =>
                                            setFilters({ ...filters, supplierCode: e.target.value })
                                        }
                                        size="small"
                                        placeholder="Filter by supplier code"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={filters.status}
                                            onChange={(e) =>
                                                setFilters({ ...filters, status: e.target.value })
                                            }
                                            label="Status"
                                        >
                                            <MenuItem value="">All Status</MenuItem>
                                            <MenuItem value="Normal">Normal</MenuItem>
                                            <MenuItem value="Low Stock">Low Stock</MenuItem>
                                            <MenuItem value="Critical">Critical</MenuItem>
                                            <MenuItem value="Overstocked">Overstocked</MenuItem>
                                            <MenuItem value="No Alert Set">No Alert Set</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
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

                    {/* Product Table */}
                    {!loading && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Product Status Overview ({filteredProducts.length} products)
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                
                                <TableContainer component={Paper} elevation={1}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                                <TableCell><strong>Code</strong></TableCell>
                                                <TableCell><strong>Product Name</strong></TableCell>
                                                <TableCell align="right"><strong>Box Qty</strong></TableCell>
                                                <TableCell align="center"><strong>Status</strong></TableCell>
                                                <TableCell align="center"><strong>Actions</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedProducts.map((product, index) => (
                                                <TableRow key={index} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {product.janCode}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {product.supplierCode || 'No Supplier'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {product.productName}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {product.boxQuantity.toLocaleString()}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            Alert: {product.stockOutAlert}-{product.stockInAlert}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={product.status}
                                                            size="small"
                                                            color={product.statusColor}
                                                            icon={
                                                                product.status === 'Critical' ? <ErrorIcon /> :
                                                                product.status === 'Normal' ? <CheckCircle /> :
                                                                <Warning />
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Tooltip title="View Details">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => openDetailDialog(product)}
                                                            >
                                                                <Visibility />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                
                                <TablePagination
                                    rowsPerPageOptions={[10, 25, 50, 100]}
                                    component="div"
                                    count={filteredProducts.length}
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

            {/* Detail Dialog */}
            {renderDetailDialog()}

            {/* Success Snackbar */}
            <Snackbar
                open={!!success}
                autoHideDuration={4000}
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
                autoHideDuration={6000}
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