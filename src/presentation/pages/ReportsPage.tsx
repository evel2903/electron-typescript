// src/presentation/pages/ReportsPage.tsx - Updated with specified fields and product joins
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
    Snackbar,
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
} from '@mui/icons-material';
import { InventoryData } from '@/domain/entities/InventoryData';
import { StockinData } from '@/domain/entities/StockinData';
import { StockoutData } from '@/domain/entities/StockoutData';
import { Product } from '@/domain/entities/Product';
import { Supplier } from '@/domain/entities/Supplier';
import { RendererDataService } from '@/application/services/DIContainer';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

interface EnrichedInventoryData extends InventoryData {
    productName?: string;
}

interface EnrichedStockinData extends StockinData {
    productName?: string;
}

interface EnrichedStockoutData extends StockoutData {
    productName?: string;
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

export const ReportsPage: React.FC = () => {
    const [currentTab, setCurrentTab] = useState<number>(0);
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Data states
    const [inventoryData, setInventoryData] = useState<EnrichedInventoryData[]>([]);
    const [stockinData, setStockinData] = useState<EnrichedStockinData[]>([]);
    const [stockoutData, setStockoutData] = useState<EnrichedStockoutData[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [dataCounts, setDataCounts] = useState<{
        inventory: number;
        stockin: number;
        stockout: number;
    }>({ inventory: 0, stockin: 0, stockout: 0 });

    // Pagination states
    const [inventoryPage, setInventoryPage] = useState(0);
    const [stockinPage, setStockinPage] = useState(0);
    const [stockoutPage, setStockoutPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Detail dialog state
    const [detailDialog, setDetailDialog] = useState<{
        open: boolean;
        data: any;
        type: 'inventory' | 'stockin' | 'stockout';
    }>({ open: false, data: null, type: 'inventory' });

    // Filter states
    const [filters, setFilters] = useState<{
        staffCode: string;
        warehouse: string;
        productCode: string;
    }>({ staffCode: '', warehouse: '', productCode: '' });

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

    const enrichDataWithProductNames = (
        inventoryData: InventoryData[],
        stockinData: StockinData[],
        stockoutData: StockoutData[],
        products: Product[],
    ): {
        enrichedInventory: EnrichedInventoryData[];
        enrichedStockin: EnrichedStockinData[];
        enrichedStockout: EnrichedStockoutData[];
    } => {
        // Create product lookup maps
        const productByJanCode = new Map(products.map(p => [p.janCode, p.productName]));

        const enrichedInventory = inventoryData.map(item => ({
            ...item,
            productName: item.janCode ? productByJanCode.get(item.janCode) || 'Unknown Product' : 'N/A',
        }));

        const enrichedStockin = stockinData.map(item => ({
            ...item,
            productName: productByJanCode.get(item.productCode) || 'Unknown Product',
        }));

        const enrichedStockout = stockoutData.map(item => ({
            ...item,
            productName: productByJanCode.get(item.productCode) || 'Unknown Product',
        }));

        return {
            enrichedInventory,
            enrichedStockin,
            enrichedStockout,
        };
    };

    const loadReportData = async () => {
        if (!fromDate || !toDate) return;

        setLoading(true);
        setError(null);

        try {
            const apiFromDate = formatDateForAPI(fromDate);
            const apiToDate = formatDateForAPI(toDate);

            // Load all data in parallel
            const [inventoryResult, stockinResult, stockoutResult, countsResult, productsResult, suppliersResult] =
                await Promise.all([
                    dataService.getInventoryDataByDateRange(apiFromDate, apiToDate),
                    dataService.getStockinDataByDateRange(apiFromDate, apiToDate),
                    dataService.getStockoutDataByDateRange(apiFromDate, apiToDate),
                    dataService.getDataCountsByDateRange(apiFromDate, apiToDate),
                    dataService.getProducts(),
                    dataService.getSuppliers(),
                ]);

            setProducts(productsResult);
            setSuppliers(suppliersResult);

            // Enrich data with product names
            const { enrichedInventory, enrichedStockin, enrichedStockout } = enrichDataWithProductNames(
                inventoryResult,
                stockinResult,
                stockoutResult,
                productsResult,
            );

            setInventoryData(enrichedInventory);
            setStockinData(enrichedStockin);
            setStockoutData(enrichedStockout);
            setDataCounts(countsResult);

            // Reset pagination when data changes
            setInventoryPage(0);
            setStockinPage(0);
            setStockoutPage(0);
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

    const getSupplierName = (supplierCode: string): string => {
        const supplier = suppliers.find(s => s.supplierCode === supplierCode);
        return supplier ? supplier.supplierName : supplierCode;
    };

    const handleDownloadExcel = () => {
        try {
            const XLSX = require('xlsx');
            
            // Get filtered data and tab info for current tab only
            let filteredData: any[] = [];
            let tabName = '';
            let dataType: 'inventory' | 'stockin' | 'stockout' = 'inventory';
            
            switch (currentTab) {
                case 0:
                    filteredData = getFilteredData(inventoryData, 'inventory');
                    tabName = 'Inventory';
                    dataType = 'inventory';
                    break;
                case 1:
                    filteredData = getFilteredData(stockinData, 'stockin');
                    tabName = 'Stock_In';
                    dataType = 'stockin';
                    break;
                case 2:
                    filteredData = getFilteredData(stockoutData, 'stockout');
                    tabName = 'Stock_Out';
                    dataType = 'stockout';
                    break;
                default:
                    filteredData = getFilteredData(inventoryData, 'inventory');
                    tabName = 'Inventory';
                    dataType = 'inventory';
            }

            // Prepare summary data for Excel export
            const summaryData = [
                [`${tabName} Report Export`],
                ['Generated Date:', new Date().toLocaleString()],
                ['Date Range:', `${fromDate} to ${toDate}`],
                ['Report Type:', tabName.replace('_', ' ')],
                ['Total Records:', filteredData.length.toString()],
                [], // Empty row for spacing
                ['Filters Applied:'],
                ['Staff Code Filter:', filters.staffCode || 'None'],
                ['Warehouse Filter:', filters.warehouse || 'None'],
                ['Product Code Filter:', filters.productCode || 'None'],
                [], // Empty row for spacing
                ['Data Details:'],
            ];

            // Create workbook
            const workbook = XLSX.utils.book_new();

            // Summary sheet
            const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

            // Data sheet based on current tab
            if (filteredData.length > 0) {
                let sheetData: any[] = [];
                let columnWidths: any[] = [];

                if (dataType === 'inventory') {
                    sheetData = filteredData.map((item, index) => ({
                        'No.': index + 1,
                        'Date': item.inputDate,
                        'Staff': item.staffCode,
                        'Warehouse': item.shopCode,
                        'Code': item.janCode || 'N/A',
                        'Product Name': item.productName || 'N/A',
                        'System Quantity': item.systemQuantity,
                        'Quantity': item.quantity,
                        'Discrepancy': item.quantityDiscrepancy,
                    }));

                    columnWidths = [
                        { wch: 5 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
                        { wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
                    ];
                } else if (dataType === 'stockin') {
                    sheetData = filteredData.map((item, index) => ({
                        'No.': index + 1,
                        'Date': item.inputDate,
                        'Staff': item.staffCode,
                        'Warehouse': item.shopCode,
                        'Code': item.productCode,
                        'Product Name': item.productName || 'N/A',
                        'Supplier Code': item.supplierCode || 'N/A',
                        'Supplier Name': getSupplierName(item.supplierCode || ''),
                        'Quantity': item.quantity,
                    }));

                    columnWidths = [
                        { wch: 5 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
                        { wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 10 },
                    ];
                } else if (dataType === 'stockout') {
                    sheetData = filteredData.map((item, index) => ({
                        'No.': index + 1,
                        'Date': item.inputDate,
                        'Staff': item.staffCode,
                        'Warehouse': item.shopCode,
                        'Code': item.productCode,
                        'Product Name': item.productName || 'N/A',
                        'Department Code': item.deptCode,
                        'Department Name': item.deptName,
                        'Quantity': item.quantity,
                    }));

                    columnWidths = [
                        { wch: 5 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
                        { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 10 },
                    ];
                }

                const dataWorksheet = XLSX.utils.json_to_sheet(sheetData);
                dataWorksheet['!cols'] = columnWidths;
                XLSX.utils.book_append_sheet(workbook, dataWorksheet, `${tabName} Data`);
            }

            // Generate filename with current date and time
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `${tabName}_Report_${timestamp}.xlsx`;

            // Save the file
            XLSX.writeFile(workbook, filename);

            setSuccess(`Excel file exported successfully: ${filename} (${filteredData.length} ${tabName.replace('_', ' ').toLowerCase()} records included)`);
        } catch (error) {
            console.error('Failed to export Excel file:', error);
            setError('Failed to export Excel file. Please verify system permissions and try again.');
        }
    };

    const handleCloseError = () => {
        setError(null);
    };

    const handleCloseSuccess = () => {
        setSuccess(null);
    };

    const openDetailDialog = (data: any, type: 'inventory' | 'stockin' | 'stockout') => {
        setDetailDialog({ open: true, data, type });
    };

    const closeDetailDialog = () => {
        setDetailDialog({ open: false, data: null, type: 'inventory' });
    };

    const getFilteredData = (data: any[], type: 'inventory' | 'stockin' | 'stockout') => {
        return data.filter((item) => {
            const staffMatch =
                !filters.staffCode ||
                item.staffCode?.toLowerCase().includes(filters.staffCode.toLowerCase());
            const warehouseMatch =
                !filters.warehouse ||
                item.shopCode?.toLowerCase().includes(filters.warehouse.toLowerCase());

            let productMatch = true;
            if (filters.productCode) {
                if (type === 'inventory') {
                    productMatch = item.janCode
                        ?.toLowerCase()
                        .includes(filters.productCode.toLowerCase());
                } else {
                    productMatch = item.productCode
                        ?.toLowerCase()
                        .includes(filters.productCode.toLowerCase());
                }
            }

            return staffMatch && warehouseMatch && productMatch;
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
                                <TableCell><strong>Date</strong></TableCell>
                                <TableCell><strong>Staff</strong></TableCell>
                                <TableCell><strong>Warehouse</strong></TableCell>
                                <TableCell><strong>Code</strong></TableCell>
                                <TableCell><strong>Product Name</strong></TableCell>
                                <TableCell align="right"><strong>System Quantity</strong></TableCell>
                                <TableCell align="right"><strong>Quantity</strong></TableCell>
                                <TableCell align="right"><strong>Discrepancy</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedData.map((item, index) => (
                                <TableRow key={index} hover>
                                    <TableCell>{item.inputDate}</TableCell>
                                    <TableCell>{item.staffCode}</TableCell>
                                    <TableCell>{item.shopCode}</TableCell>
                                    <TableCell>{item.janCode || 'N/A'}</TableCell>
                                    <TableCell>{item.productName || 'N/A'}</TableCell>
                                    <TableCell align="right">{item.systemQuantity.toLocaleString()}</TableCell>
                                    <TableCell align="right">{item.quantity.toLocaleString()}</TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={item.quantityDiscrepancy}
                                            size="small"
                                            color={item.quantityDiscrepancy === 0 ? 'success' : 'warning'}
                                        />
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
                                <TableCell><strong>Date</strong></TableCell>
                                <TableCell><strong>Staff</strong></TableCell>
                                <TableCell><strong>Warehouse</strong></TableCell>
                                <TableCell><strong>Code</strong></TableCell>
                                <TableCell><strong>Product Name</strong></TableCell>
                                <TableCell><strong>Supplier Code</strong></TableCell>
                                <TableCell><strong>Supplier Name</strong></TableCell>
                                <TableCell align="right"><strong>Quantity</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedData.map((item, index) => (
                                <TableRow key={index} hover>
                                    <TableCell>{item.inputDate}</TableCell>
                                    <TableCell>{item.staffCode}</TableCell>
                                    <TableCell>{item.shopCode}</TableCell>
                                    <TableCell>{item.productCode}</TableCell>
                                    <TableCell>{item.productName || 'N/A'}</TableCell>
                                    <TableCell>{item.supplierCode || 'N/A'}</TableCell>
                                    <TableCell>{getSupplierName(item.supplierCode || '')}</TableCell>
                                    <TableCell align="right">{item.quantity.toLocaleString()}</TableCell>
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
                                <TableCell><strong>Date</strong></TableCell>
                                <TableCell><strong>Staff</strong></TableCell>
                                <TableCell><strong>Warehouse</strong></TableCell>
                                <TableCell><strong>Code</strong></TableCell>
                                <TableCell><strong>Product Name</strong></TableCell>
                                <TableCell><strong>Department Code</strong></TableCell>
                                <TableCell><strong>Department Name</strong></TableCell>
                                <TableCell align="right"><strong>Quantity</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedData.map((item, index) => (
                                <TableRow key={index} hover>
                                    <TableCell>{item.inputDate}</TableCell>
                                    <TableCell>{item.staffCode}</TableCell>
                                    <TableCell>{item.shopCode}</TableCell>
                                    <TableCell>{item.productCode}</TableCell>
                                    <TableCell>{item.productName || 'N/A'}</TableCell>
                                    <TableCell>{item.deptCode}</TableCell>
                                    <TableCell>{item.deptName}</TableCell>
                                    <TableCell align="right">{item.quantity.toLocaleString()}</TableCell>
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

    const renderDetailDialog = () => {
        const { open, data, type } = detailDialog;
        if (!open || !data) return null;

        const getDetailFields = () => {
            switch (type) {
                case 'inventory':
                    return [
                        { label: 'Date', value: data.inputDate },
                        { label: 'Staff', value: data.staffCode },
                        { label: 'Warehouse', value: data.shopCode },
                        { label: 'Code', value: data.janCode || 'N/A' },
                        { label: 'Product Name', value: data.productName || 'N/A' },
                        { label: 'System Quantity', value: data.systemQuantity.toLocaleString() },
                        { label: 'Quantity', value: data.quantity.toLocaleString() },
                        { label: 'Discrepancy', value: data.quantityDiscrepancy },
                        { label: 'Cost', value: `¥${data.cost.toLocaleString()}` },
                        { label: 'Price', value: `¥${data.price.toLocaleString()}` },
                        { label: 'Note', value: data.note || 'N/A' },
                    ];
                case 'stockin':
                    return [
                        { label: 'Date', value: data.inputDate },
                        { label: 'Staff', value: data.staffCode },
                        { label: 'Warehouse', value: data.shopCode },
                        { label: 'Code', value: data.productCode },
                        { label: 'Product Name', value: data.productName || 'N/A' },
                        { label: 'Supplier Code', value: data.supplierCode || 'N/A' },
                        { label: 'Supplier Name', value: getSupplierName(data.supplierCode || '') },
                        { label: 'Quantity', value: data.quantity.toLocaleString() },
                        { label: 'Location', value: data.location },
                        { label: 'Slip Number', value: data.slipNumber },
                        { label: 'Note', value: data.note || 'N/A' },
                    ];
                case 'stockout':
                    return [
                        { label: 'Date', value: data.inputDate },
                        { label: 'Staff', value: data.staffCode },
                        { label: 'Warehouse', value: data.shopCode },
                        { label: 'Code', value: data.productCode },
                        { label: 'Product Name', value: data.productName || 'N/A' },
                        { label: 'Department Code', value: data.deptCode },
                        { label: 'Department Name', value: data.deptName },
                        { label: 'Quantity', value: data.quantity.toLocaleString() },
                        { label: 'Location', value: data.location },
                        { label: 'Slip Number', value: data.slipNumber },
                        { label: 'Note', value: data.note || 'N/A' },
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

    // Calculate filtered records for current tab only
    const getCurrentTabFilteredRecords = () => {
        switch (currentTab) {
            case 0:
                return getFilteredData(inventoryData, 'inventory').length;
            case 1:
                return getFilteredData(stockinData, 'stockin').length;
            case 2:
                return getFilteredData(stockoutData, 'stockout').length;
            default:
                return 0;
        }
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

                        <Box display="flex" gap={2}>
                            <Tooltip title={`Export ${currentTab === 0 ? 'Inventory' : currentTab === 1 ? 'Stock In' : 'Stock Out'} data to Excel`}>
                                <span>
                                    <Button
                                        variant="outlined"
                                        startIcon={<GetApp />}
                                        onClick={handleDownloadExcel}
                                        disabled={loading || getCurrentTabFilteredRecords() === 0}
                                    >
                                        Export Current Tab
                                    </Button>
                                </span>
                            </Tooltip>
                            <Button
                                variant="outlined"
                                startIcon={<Refresh />}
                                onClick={handleRefresh}
                                disabled={loading}
                            >
                                Refresh Data
                            </Button>
                        </Box>
                    </Box>

                    <Typography variant="body1" color="text.secondary" paragraph>
                        View and analyze inventory transactions, stock movements, and operational
                        data. Filter by date range and various criteria to generate detailed reports
                        for business analysis.
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
                                        label="Warehouse"
                                        value={filters.warehouse}
                                        onChange={(e) =>
                                            setFilters({ ...filters, warehouse: e.target.value })
                                        }
                                        size="small"
                                        placeholder="Filter by warehouse"
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
                                        placeholder="Filter by product code"
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
                        </Card>
                    )}
                </Box>
            </Container>

            {/* Detail Dialog */}
            {renderDetailDialog()}

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