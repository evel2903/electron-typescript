// src/presentation/pages/ProductStatusPage.tsx
import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    TextField,
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
} from '@mui/material';
import {
    Category,
    Refresh,
    DateRange,
    FilterList,
    Visibility,
    Close,
    TrendingUp,
    TrendingDown,
    Inventory,
} from '@mui/icons-material';
import { InventoryData } from '@/domain/entities/InventoryData';
import { StockinData } from '@/domain/entities/StockinData';
import { StockoutData } from '@/domain/entities/StockoutData';
import { Product } from '@/domain/entities/Product';
import { RendererDataService } from '@/application/services/DIContainer';

interface ProductStatus extends Product {
    latestInventoryDate: string;
    totalQuantity: number;
    totalSystemQuantity: number;
    totalDiscrepancy: number;
    recentStockin: number;
    recentStockout: number;
    averageCost: number;
    lastPrice: number;
    status: 'Balanced' | 'Surplus' | 'Deficit';
}

export const ProductStatusPage: React.FC = () => {
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [inventoryData, setInventoryData] = useState<InventoryData[]>([]);
    const [stockinData, setStockinData] = useState<StockinData[]>([]);
    const [stockoutData, setStockoutData] = useState<StockoutData[]>([]);
    const [productsData, setProductsData] = useState<Product[]>([]);

    // Pagination states
    const [productPage, setProductPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Detail dialog state
    const [detailDialog, setDetailDialog] = useState<{
        open: boolean;
        data: any;
    }>({ open: false, data: null });

    // Filter states
    const [filters, setFilters] = useState<{
        productCode: string;
        supplierCode: string;
        productName: string;
        status: string;
    }>({ productCode: '', supplierCode: '', productName: '', status: '' });

    const dataService = RendererDataService.getInstance();

    useEffect(() => {
        // Set default date range to last 30 days
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        setToDate(formatDateForInput(today));
        setFromDate(formatDateForInput(thirtyDaysAgo));
    }, []);

    useEffect(() => {
        if (fromDate && toDate) {
            loadProductStatusData();
        }
    }, [fromDate, toDate]);

    const formatDateForInput = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    const formatDateForAPI = (dateString: string): string => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}/${month}/${day}`;
    };

    const loadProductStatusData = async () => {
        if (!fromDate || !toDate) return;

        setLoading(true);
        setError(null);

        try {
            const apiFromDate = formatDateForAPI(fromDate);
            const apiToDate = formatDateForAPI(toDate);

            // Load all data in parallel
            const [inventoryResult, stockinResult, stockoutResult, productsResult] =
                await Promise.all([
                    dataService.getInventoryDataByDateRange(apiFromDate, apiToDate),
                    dataService.getStockinDataByDateRange(apiFromDate, apiToDate),
                    dataService.getStockoutDataByDateRange(apiFromDate, apiToDate),
                    dataService.getProducts(),
                ]);

            setInventoryData(inventoryResult);
            setStockinData(stockinResult);
            setStockoutData(stockoutResult);
            setProductsData(productsResult);

            // Reset pagination when data changes
            setProductPage(0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load product status data');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        loadProductStatusData();
    };

    const handleQuickDateRange = (days: number) => {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - days);

        setFromDate(formatDateForInput(startDate));
        setToDate(formatDateForInput(today));
    };

    const openDetailDialog = (data: any) => {
        setDetailDialog({ open: true, data });
    };

    const closeDetailDialog = () => {
        setDetailDialog({ open: false, data: null });
    };

    const getFilteredProductStatusData = (): ProductStatus[] => {
        // Calculate product status from inventory data
        const productStatusData: ProductStatus[] = productsData.map((product) => {
            // Find latest inventory data for this product
            const productInventoryData = inventoryData.filter(
                (inv) => inv.janCode === product.janCode,
            );
            const latestInventory = productInventoryData.sort(
                (a, b) => new Date(b.inputDate).getTime() - new Date(a.inputDate).getTime(),
            )[0];

            // Calculate total quantity from all inventory records
            const totalQuantity = productInventoryData.reduce((sum, inv) => sum + inv.quantity, 0);
            const totalSystemQuantity = productInventoryData.reduce(
                (sum, inv) => sum + inv.systemQuantity,
                0,
            );
            const totalDiscrepancy = totalQuantity - totalSystemQuantity;

            // Find recent stock movements
            const recentStockin = stockinData.filter(
                (si) => si.productCode === product.janCode,
            ).length;
            const recentStockout = stockoutData.filter(
                (so) => so.productCode === product.janCode,
            ).length;

            return {
                ...product,
                latestInventoryDate: latestInventory?.inputDate || 'No data',
                totalQuantity,
                totalSystemQuantity,
                totalDiscrepancy,
                recentStockin,
                recentStockout,
                averageCost: latestInventory?.cost || 0,
                lastPrice: latestInventory?.price || 0,
                status:
                    totalDiscrepancy === 0
                        ? 'Balanced'
                        : totalDiscrepancy > 0
                          ? 'Surplus'
                          : 'Deficit',
            };
        });

        // Apply filters
        return productStatusData.filter((item) => {
            const productCodeMatch =
                !filters.productCode ||
                item.janCode?.toLowerCase().includes(filters.productCode.toLowerCase()) ||
                item.productName?.toLowerCase().includes(filters.productCode.toLowerCase());

            const supplierMatch =
                !filters.supplierCode ||
                item.supplierCode?.toLowerCase().includes(filters.supplierCode.toLowerCase());

            const productNameMatch =
                !filters.productName ||
                item.productName?.toLowerCase().includes(filters.productName.toLowerCase());

            const statusMatch = !filters.status || item.status === filters.status;

            return productCodeMatch && supplierMatch && productNameMatch && statusMatch;
        });
    };

    const renderProductStatusTable = () => {
        const filteredData = getFilteredProductStatusData();
        const paginatedData = filteredData.slice(
            productPage * rowsPerPage,
            productPage * rowsPerPage + rowsPerPage,
        );

        return (
            <Box>
                <TableContainer component={Paper} elevation={1}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell>
                                    <strong>Code</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Product Name</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Supplier</strong>
                                </TableCell>
                                <TableCell align="right">
                                    <strong>Box Qty</strong>
                                </TableCell>
                                <TableCell align="right">
                                    <strong>Current Stock</strong>
                                </TableCell>
                                <TableCell align="right">
                                    <strong>System Stock</strong>
                                </TableCell>
                                <TableCell align="center">
                                    <strong>Status</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Last Inventory</strong>
                                </TableCell>
                                <TableCell align="right">
                                    <strong>Recent In/Out</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Actions</strong>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedData.map((item, index) => (
                                <TableRow key={index} hover>
                                    <TableCell>{item.janCode}</TableCell>
                                    <TableCell>{item.productName}</TableCell>
                                    <TableCell>{item.supplierCode || 'N/A'}</TableCell>
                                    <TableCell align="right">
                                        {item.boxQuantity.toLocaleString()}
                                    </TableCell>
                                    <TableCell align="right">
                                        {item.totalQuantity.toLocaleString()}
                                    </TableCell>
                                    <TableCell align="right">
                                        {item.totalSystemQuantity.toLocaleString()}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={item.status}
                                            size="small"
                                            color={
                                                item.status === 'Balanced'
                                                    ? 'success'
                                                    : item.status === 'Surplus'
                                                      ? 'warning'
                                                      : 'error'
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>{item.latestInventoryDate}</TableCell>
                                    <TableCell align="right">
                                        <Box display="flex" gap={1}>
                                            <Chip
                                                label={`+${item.recentStockin}`}
                                                size="small"
                                                color="success"
                                                variant="outlined"
                                            />
                                            <Chip
                                                label={`-${item.recentStockout}`}
                                                size="small"
                                                color="error"
                                                variant="outlined"
                                            />
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => openDetailDialog(item)}
                                        >
                                            <Visibility />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    component="div"
                    count={filteredData.length}
                    rowsPerPage={rowsPerPage}
                    page={productPage}
                    onPageChange={(_, newPage) => setProductPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setProductPage(0);
                    }}
                />
            </Box>
        );
    };

    const renderDetailDialog = () => {
        const { open, data } = detailDialog;
        if (!open || !data) return null;

        const getDetailFields = () => [
            { label: 'JAN Code', value: data.janCode },
            { label: 'Product Name', value: data.productName },
            { label: 'Supplier Code', value: data.supplierCode || 'N/A' },
            { label: 'Box Quantity', value: data.boxQuantity.toLocaleString() },
            {
                label: 'Current Stock',
                value: data.totalQuantity?.toLocaleString() || '0',
            },
            {
                label: 'System Stock',
                value: data.totalSystemQuantity?.toLocaleString() || '0',
            },
            {
                label: 'Discrepancy',
                value: data.totalDiscrepancy?.toLocaleString() || '0',
            },
            { label: 'Status', value: data.status || 'Unknown' },
            { label: 'Recent Stock In', value: data.recentStockin?.toString() || '0' },
            {
                label: 'Recent Stock Out',
                value: data.recentStockout?.toString() || '0',
            },
            {
                label: 'Last Inventory Date',
                value: data.latestInventoryDate || 'No data',
            },
            {
                label: 'Average Cost',
                value: data.averageCost
                    ? `¥${data.averageCost.toLocaleString()}`
                    : 'N/A',
            },
            {
                label: 'Last Price',
                value: data.lastPrice ? `¥${data.lastPrice.toLocaleString()}` : 'N/A',
            },
        ];

        return (
            <Dialog open={open} onClose={closeDetailDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        Product Status Details
                        <IconButton onClick={closeDetailDialog}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <List>
                        {getDetailFields().map((field, index) => (
                            <React.Fragment key={index}>
                                <ListItem>
                                    <ListItemText
                                        primary={field.label}
                                        secondary={field.value}
                                        primaryTypographyProps={{ fontWeight: 'medium' }}
                                    />
                                </ListItem>
                                {index < getDetailFields().length - 1 && <Divider />}
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

    const getStatusCounts = () => {
        const filteredData = getFilteredProductStatusData();
        return {
            total: filteredData.length,
            balanced: filteredData.filter(p => p.status === 'Balanced').length,
            surplus: filteredData.filter(p => p.status === 'Surplus').length,
            deficit: filteredData.filter(p => p.status === 'Deficit').length,
        };
    };

    const statusCounts = getStatusCounts();

    return (
        <>
            <Container maxWidth="xl">
                <Box py={4}>
                    {/* Header */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
                        <Box display="flex" alignItems="center">
                            <Category sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
                            <Typography variant="h3" component="h1">
                                Product Status Dashboard
                            </Typography>
                        </Box>

                        <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={handleRefresh}
                            disabled={loading}
                        >
                            Refresh Data
                        </Button>
                    </Box>

                    <Typography variant="body1" color="text.secondary" paragraph>
                        Monitor product inventory status, stock levels, and discrepancies across all products. 
                        View current stock compared to system quantities and track recent stock movements.
                    </Typography>

                    {/* Date Range Controls */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <DateRange sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Date Range Selection
                            </Typography>

                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={3}>
                                    <TextField
                                        fullWidth
                                        label="From Date"
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <TextField
                                        fullWidth
                                        label="To Date"
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box display="flex" gap={1} flexWrap="wrap">
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleQuickDateRange(7)}
                                        >
                                            Last 7 Days
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleQuickDateRange(30)}
                                        >
                                            Last 30 Days
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleQuickDateRange(90)}
                                        >
                                            Last 90 Days
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Summary Cards */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={3}>
                            <Card sx={{ bgcolor: '#e3f2fd' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center">
                                        <Category
                                            sx={{ mr: 2, color: 'primary.main', fontSize: 40 }}
                                        />
                                        <Box>
                                            <Typography variant="h4" color="primary">
                                                {statusCounts.total.toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Total Products
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Card sx={{ bgcolor: '#e8f5e8' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center">
                                        <Inventory
                                            sx={{ mr: 2, color: 'success.main', fontSize: 40 }}
                                        />
                                        <Box>
                                            <Typography variant="h4" color="success.main">
                                                {statusCounts.balanced.toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Balanced
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Card sx={{ bgcolor: '#fff3e0' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center">
                                        <TrendingUp sx={{ mr: 2, color: 'warning.main', fontSize: 40 }} />
                                        <Box>
                                            <Typography variant="h4" color="warning.main">
                                                {statusCounts.surplus.toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Surplus
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Card sx={{ bgcolor: '#fce4ec' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center">
                                        <TrendingDown sx={{ mr: 2, color: 'error.main', fontSize: 40 }} />
                                        <Box>
                                            <Typography variant="h4" color="error.main">
                                                {statusCounts.deficit.toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Deficit
                                            </Typography>
                                        </Box>
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
                                Filters
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
                                        placeholder="Filter by product or JAN code"
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
                                        select
                                        label="Status"
                                        value={filters.status}
                                        onChange={(e) =>
                                            setFilters({ ...filters, status: e.target.value })
                                        }
                                        size="small"
                                        SelectProps={{ native: true }}
                                    >
                                        <option value="">All Status</option>
                                        <option value="Balanced">Balanced</option>
                                        <option value="Surplus">Surplus</option>
                                        <option value="Deficit">Deficit</option>
                                    </TextField>
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

                    {/* Product Status Table */}
                    {!loading && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Product Status Overview ({getFilteredProductStatusData().length} products)
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                {renderProductStatusTable()}
                            </CardContent>
                        </Card>
                    )}
                </Box>
            </Container>

            {/* Detail Dialog */}
            {renderDetailDialog()}
        </>
    );
};