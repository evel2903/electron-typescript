// src/presentation/pages/ReportsPage.tsx
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
    Tabs,
    Tab,
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Assessment,
    Refresh,
    GetApp,
    Inventory,
    Input,
    Output,
    DateRange,
    FilterList,
    Visibility,
    Close,
    Category,
} from '@mui/icons-material';
import { InventoryData } from '@/domain/entities/InventoryData';
import { StockinData } from '@/domain/entities/StockinData';
import { StockoutData } from '@/domain/entities/StockoutData';
import { Product } from '@/domain/entities/Product';
import { RendererDataService } from '@/application/services/DIContainer';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`report-tabpanel-${index}`}
            aria-labelledby={`report-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

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

export const ReportsPage: React.FC = () => {
    const [currentTab, setCurrentTab] = useState<number>(0);
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [inventoryData, setInventoryData] = useState<InventoryData[]>([]);
    const [stockinData, setStockinData] = useState<StockinData[]>([]);
    const [stockoutData, setStockoutData] = useState<StockoutData[]>([]);
    const [productsData, setProductsData] = useState<Product[]>([]);
    const [dataCounts, setDataCounts] = useState<{
        inventory: number;
        stockin: number;
        stockout: number;
    }>({ inventory: 0, stockin: 0, stockout: 0 });

    // Pagination states
    const [inventoryPage, setInventoryPage] = useState(0);
    const [stockinPage, setStockinPage] = useState(0);
    const [stockoutPage, setStockoutPage] = useState(0);
    const [productPage, setProductPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Detail dialog state
    const [detailDialog, setDetailDialog] = useState<{
        open: boolean;
        data: any;
        type: 'inventory' | 'stockin' | 'stockout' | 'product';
    }>({ open: false, data: null, type: 'inventory' });

    // Filter states
    const [filters, setFilters] = useState<{
        staffCode: string;
        shopCode: string;
        productCode: string;
    }>({ staffCode: '', shopCode: '', productCode: '' });

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
            loadReportData();
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

    const loadReportData = async () => {
        if (!fromDate || !toDate) return;

        setLoading(true);
        setError(null);

        try {
            const apiFromDate = formatDateForAPI(fromDate);
            const apiToDate = formatDateForAPI(toDate);

            // Load all data in parallel
            const [inventoryResult, stockinResult, stockoutResult, countsResult, productsResult] =
                await Promise.all([
                    dataService.getInventoryDataByDateRange(apiFromDate, apiToDate),
                    dataService.getStockinDataByDateRange(apiFromDate, apiToDate),
                    dataService.getStockoutDataByDateRange(apiFromDate, apiToDate),
                    dataService.getDataCountsByDateRange(apiFromDate, apiToDate),
                    dataService.getProducts(),
                ]);

            setInventoryData(inventoryResult);
            setStockinData(stockinResult);
            setStockoutData(stockoutResult);
            setDataCounts(countsResult);
            setProductsData(productsResult);

            // Reset pagination when data changes
            setInventoryPage(0);
            setStockinPage(0);
            setStockoutPage(0);
            setProductPage(0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    const handleRefresh = () => {
        loadReportData();
    };

    const handleQuickDateRange = (days: number) => {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - days);

        setFromDate(formatDateForInput(startDate));
        setToDate(formatDateForInput(today));
    };

    const openDetailDialog = (
        data: any,
        type: 'inventory' | 'stockin' | 'stockout' | 'product',
    ) => {
        setDetailDialog({ open: true, data, type });
    };

    const closeDetailDialog = () => {
        setDetailDialog({ open: false, data: null, type: 'inventory' });
    };

    const getFilteredData = (
        data: any[],
        type: 'inventory' | 'stockin' | 'stockout' | 'product',
    ) => {
        return data.filter((item) => {
            const staffMatch =
                !filters.staffCode ||
                item.staffCode?.toLowerCase().includes(filters.staffCode.toLowerCase());
            const shopMatch =
                !filters.shopCode ||
                item.shopCode?.toLowerCase().includes(filters.shopCode.toLowerCase());

            let productMatch = true;
            if (filters.productCode) {
                if (type === 'inventory') {
                    productMatch = item.janCode
                        ?.toLowerCase()
                        .includes(filters.productCode.toLowerCase());
                } else if (type === 'product') {
                    productMatch =
                        item.janCode?.toLowerCase().includes(filters.productCode.toLowerCase()) ||
                        item.productName?.toLowerCase().includes(filters.productCode.toLowerCase());
                } else {
                    productMatch = item.productCode
                        ?.toLowerCase()
                        .includes(filters.productCode.toLowerCase());
                }
            }

            return staffMatch && shopMatch && productMatch;
        });
    };

    const renderInventoryTable = () => {
        const filteredData = getFilteredData(inventoryData, 'inventory');
        const paginatedData = filteredData.slice(
            inventoryPage * rowsPerPage,
            inventoryPage * rowsPerPage + rowsPerPage,
        );

        return (
            <Box>
                <TableContainer component={Paper} elevation={1}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell>
                                    <strong>Date</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Staff</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Shop</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Location</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>JAN Code</strong>
                                </TableCell>
                                <TableCell align="right">
                                    <strong>Quantity</strong>
                                </TableCell>
                                <TableCell align="right">
                                    <strong>System Qty</strong>
                                </TableCell>
                                <TableCell align="right">
                                    <strong>Discrepancy</strong>
                                </TableCell>
                                <TableCell align="right">
                                    <strong>Cost</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Actions</strong>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedData.map((item, index) => (
                                <TableRow key={index} hover>
                                    <TableCell>{item.inputDate}</TableCell>
                                    <TableCell>{item.staffCode}</TableCell>
                                    <TableCell>{item.shopCode}</TableCell>
                                    <TableCell>{`${item.shelfNumber}-${item.shelfPosition}`}</TableCell>
                                    <TableCell>{item.janCode || 'N/A'}</TableCell>
                                    <TableCell align="right">
                                        {item.quantity.toLocaleString()}
                                    </TableCell>
                                    <TableCell align="right">
                                        {item.systemQuantity.toLocaleString()}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={item.quantityDiscrepancy}
                                            size="small"
                                            color={
                                                item.quantityDiscrepancy === 0
                                                    ? 'success'
                                                    : 'warning'
                                            }
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        ¥{item.cost.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => openDetailDialog(item, 'inventory')}
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
                    page={inventoryPage}
                    onPageChange={(_, newPage) => setInventoryPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setInventoryPage(0);
                    }}
                />
            </Box>
        );
    };

    const renderStockinTable = () => {
        const filteredData = getFilteredData(stockinData, 'stockin');
        const paginatedData = filteredData.slice(
            stockinPage * rowsPerPage,
            stockinPage * rowsPerPage + rowsPerPage,
        );

        return (
            <Box>
                <TableContainer component={Paper} elevation={1}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell>
                                    <strong>Date</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Slip Number</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Supplier</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Product Code</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Location</strong>
                                </TableCell>
                                <TableCell align="right">
                                    <strong>Quantity</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Staff</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Shop</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Actions</strong>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedData.map((item, index) => (
                                <TableRow key={index} hover>
                                    <TableCell>{item.inputDate}</TableCell>
                                    <TableCell>{item.slipNumber}</TableCell>
                                    <TableCell>
                                        {item.supplierName || item.supplierCode || 'N/A'}
                                    </TableCell>
                                    <TableCell>{item.productCode}</TableCell>
                                    <TableCell>{`${item.location} ${item.shelfNo}-${item.shelfPosition}`}</TableCell>
                                    <TableCell align="right">
                                        {item.quantity.toLocaleString()}
                                    </TableCell>
                                    <TableCell>{item.staffCode}</TableCell>
                                    <TableCell>{item.shopCode}</TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => openDetailDialog(item, 'stockin')}
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
                    page={stockinPage}
                    onPageChange={(_, newPage) => setStockinPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setStockinPage(0);
                    }}
                />
            </Box>
        );
    };

    const renderStockoutTable = () => {
        const filteredData = getFilteredData(stockoutData, 'stockout');
        const paginatedData = filteredData.slice(
            stockoutPage * rowsPerPage,
            stockoutPage * rowsPerPage + rowsPerPage,
        );

        return (
            <Box>
                <TableContainer component={Paper} elevation={1}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell>
                                    <strong>Date</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Slip Number</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Department</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Product Code</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Location</strong>
                                </TableCell>
                                <TableCell align="right">
                                    <strong>Quantity</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Staff</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Shop</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Actions</strong>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedData.map((item, index) => (
                                <TableRow key={index} hover>
                                    <TableCell>{item.inputDate}</TableCell>
                                    <TableCell>{item.slipNumber}</TableCell>
                                    <TableCell>{`${item.deptCode} - ${item.deptName}`}</TableCell>
                                    <TableCell>{item.productCode}</TableCell>
                                    <TableCell>{`${item.location} ${item.shelfNo}-${item.shelfPosition}`}</TableCell>
                                    <TableCell align="right">
                                        {item.quantity.toLocaleString()}
                                    </TableCell>
                                    <TableCell>{item.staffCode}</TableCell>
                                    <TableCell>{item.shopCode}</TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => openDetailDialog(item, 'stockout')}
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
                    page={stockoutPage}
                    onPageChange={(_, newPage) => setStockoutPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setStockoutPage(0);
                    }}
                />
            </Box>
        );
    };

    const renderProductStatusTable = () => {
        const filteredData = getFilteredData(productsData, 'product');

        // Calculate product status from inventory data
        const productStatusData: ProductStatus[] = filteredData.map((product) => {
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

        const paginatedData = productStatusData.slice(
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
                                    <strong>JAN Code</strong>
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
                                            onClick={() => openDetailDialog(item, 'product')}
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
                    count={productStatusData.length}
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
        const { open, data, type } = detailDialog;
        if (!open || !data) return null;

        const getDetailFields = () => {
            switch (type) {
                case 'inventory':
                    return [
                        { label: 'Input Date', value: data.inputDate },
                        { label: 'Staff Code', value: data.staffCode },
                        { label: 'Shop Code', value: data.shopCode },
                        { label: 'Shelf Number', value: data.shelfNumber },
                        { label: 'Shelf Position', value: data.shelfPosition },
                        { label: 'JAN Code', value: data.janCode || 'N/A' },
                        { label: 'Quantity', value: data.quantity.toLocaleString() },
                        { label: 'Cost', value: `¥${data.cost.toLocaleString()}` },
                        { label: 'Price', value: `¥${data.price.toLocaleString()}` },
                        { label: 'System Quantity', value: data.systemQuantity.toLocaleString() },
                        { label: 'Quantity Discrepancy', value: data.quantityDiscrepancy },
                        { label: 'Note', value: data.note || 'N/A' },
                        { label: 'Update Date', value: data.updateDate || 'N/A' },
                        { label: 'Update Time', value: data.updateTime || 'N/A' },
                    ];
                case 'stockin':
                    return [
                        { label: 'Input Date', value: data.inputDate },
                        { label: 'Slip Number', value: data.slipNumber },
                        { label: 'Supplier Code', value: data.supplierCode || 'N/A' },
                        { label: 'Supplier Name', value: data.supplierName || 'N/A' },
                        { label: 'Location', value: data.location },
                        { label: 'Shelf Number', value: data.shelfNo },
                        { label: 'Shelf Position', value: data.shelfPosition },
                        { label: 'Product Code', value: data.productCode },
                        { label: 'Quantity', value: data.quantity.toLocaleString() },
                        { label: 'Staff Code', value: data.staffCode },
                        { label: 'Shop Code', value: data.shopCode },
                        { label: 'Note', value: data.note || 'N/A' },
                        { label: 'Ignore Trigger', value: data.ignoreTrigger ? 'Yes' : 'No' },
                    ];
                case 'stockout':
                    return [
                        { label: 'Input Date', value: data.inputDate },
                        { label: 'Slip Number', value: data.slipNumber },
                        { label: 'Supplier Code', value: data.supplierCode },
                        { label: 'Department Code', value: data.deptCode },
                        { label: 'Department Name', value: data.deptName },
                        { label: 'Location', value: data.location },
                        { label: 'Shelf Number', value: data.shelfNo },
                        { label: 'Shelf Position', value: data.shelfPosition },
                        { label: 'Product Code', value: data.productCode },
                        { label: 'Quantity', value: data.quantity.toLocaleString() },
                        { label: 'Staff Code', value: data.staffCode },
                        { label: 'Shop Code', value: data.shopCode },
                        { label: 'Note', value: data.note || 'N/A' },
                        { label: 'Ignore Trigger', value: data.ignoreTrigger ? 'Yes' : 'No' },
                    ];
                case 'product':
                    return [
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
                default:
                    return [];
            }
        };

        const getTitle = () => {
            switch (type) {
                case 'inventory':
                    return 'Inventory Record Details';
                case 'stockin':
                    return 'Stock In Record Details';
                case 'stockout':
                    return 'Stock Out Record Details';
                case 'product':
                    return 'Product Status Details';
                default:
                    return 'Record Details';
            }
        };

        return (
            <Dialog open={open} onClose={closeDetailDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        {getTitle()}
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

    return (
        <>
            <Container maxWidth="xl">
                <Box py={4}>
                    {/* Header */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
                        <Box display="flex" alignItems="center">
                            <Assessment sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
                            <Typography variant="h3" component="h1">
                                Reports Dashboard
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
                        <Grid item xs={12} sm={4}>
                            <Card sx={{ bgcolor: '#e3f2fd' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center">
                                        <Inventory
                                            sx={{ mr: 2, color: 'primary.main', fontSize: 40 }}
                                        />
                                        <Box>
                                            <Typography variant="h4" color="primary">
                                                {dataCounts.inventory.toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Inventory Records
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card sx={{ bgcolor: '#e8f5e8' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center">
                                        <Input
                                            sx={{ mr: 2, color: 'success.main', fontSize: 40 }}
                                        />
                                        <Box>
                                            <Typography variant="h4" color="success.main">
                                                {dataCounts.stockin.toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Stock In Records
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card sx={{ bgcolor: '#fce4ec' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center">
                                        <Output sx={{ mr: 2, color: 'error.main', fontSize: 40 }} />
                                        <Box>
                                            <Typography variant="h4" color="error.main">
                                                {dataCounts.stockout.toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Stock Out Records
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
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Staff Code"
                                        value={filters.staffCode}
                                        onChange={(e) =>
                                            setFilters({ ...filters, staffCode: e.target.value })
                                        }
                                        size="small"
                                        placeholder="Filter by staff code"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Shop Code"
                                        value={filters.shopCode}
                                        onChange={(e) =>
                                            setFilters({ ...filters, shopCode: e.target.value })
                                        }
                                        size="small"
                                        placeholder="Filter by shop code"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Product Code"
                                        value={filters.productCode}
                                        onChange={(e) =>
                                            setFilters({ ...filters, productCode: e.target.value })
                                        }
                                        size="small"
                                        placeholder="Filter by product/JAN code"
                                    />
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

                    {/* Data Tables */}
                    {!loading && (
                        <Card>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <Tabs value={currentTab} onChange={handleTabChange}>
                                    <Tab
                                        label={`Inventory (${getFilteredData(inventoryData, 'inventory').length})`}
                                        icon={<Inventory />}
                                        iconPosition="start"
                                    />
                                    <Tab
                                        label={`Stock In (${getFilteredData(stockinData, 'stockin').length})`}
                                        icon={<Input />}
                                        iconPosition="start"
                                    />
                                    <Tab
                                        label={`Stock Out (${getFilteredData(stockoutData, 'stockout').length})`}
                                        icon={<Output />}
                                        iconPosition="start"
                                    />
                                    <Tab
                                        label={`Product Status (${getFilteredData(productsData, 'product').length})`}
                                        icon={<Category />}
                                        iconPosition="start"
                                    />
                                </Tabs>
                            </Box>

                            <TabPanel value={currentTab} index={0}>
                                {renderInventoryTable()}
                            </TabPanel>

                            <TabPanel value={currentTab} index={1}>
                                {renderStockinTable()}
                            </TabPanel>

                            <TabPanel value={currentTab} index={2}>
                                {renderStockoutTable()}
                            </TabPanel>

                            <TabPanel value={currentTab} index={3}>
                                {renderProductStatusTable()}
                            </TabPanel>
                        </Card>
                    )}
                </Box>
            </Container>

            {/* Detail Dialog */}
            {renderDetailDialog()}
        </>
    );
};
