// src/presentation/pages/GetDataPage.tsx - Updated to use service layer architecture
import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Button,
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
    Divider,
    Chip,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from '@mui/material';
import {
    GetApp,
    Storage,
    CheckCircle,
    Error as ErrorIcon,
    ExpandMore,
    Inventory,
    TrendingUp,
    TrendingDown,
    Refresh,
    PhoneAndroid,
    Category,
} from '@mui/icons-material';
import { AndroidDevice } from '@/domain/entities/AndroidDevice';
import { DIContainer, RendererDataService } from '@/application/services/DIContainer';
import { SETTING_KEYS } from '@/shared/constants/settings';

interface SyncResult {
    tableName: string;
    recordsFound: number;
    recordsInserted: number;
    recordsUpdated: number;
    success: boolean;
    error?: string;
}

interface SyncProgress {
    currentTable: string;
    tablesCompleted: number;
    totalTables: number;
    currentRecords: number;
    totalRecords: number;
    overallProgress: number;
}

interface GetDataPageProps {
    connectedDevice?: AndroidDevice | null;
}

export const GetDataPage: React.FC<GetDataPageProps> = ({ connectedDevice }) => {
    const [syncing, setSyncing] = useState<boolean>(false);
    const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
    const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [importPath, setImportPath] = useState<string>('');
    const [databasePath, setDatabasePath] = useState<string>('');
    const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);

    const settingService = DIContainer.getInstance().getSettingService();
    const dataService = RendererDataService.getInstance();

    useEffect(() => {
        loadImportPath();
    }, []);

    const loadImportPath = async () => {
        try {
            const path = await settingService.getSettingValue(SETTING_KEYS.FILE_IMPORT_PATH);
            const basePath = path || '/sdcard/Downloads';
            setImportPath(basePath);
            setDatabasePath(`${basePath}/Database/kss_android.db`);
        } catch (error) {
            console.error('Failed to load import path:', error);
            setImportPath('/sdcard/Downloads');
            setDatabasePath('/sdcard/Downloads/Database/kss_android.db');
        }
    };

    const handleStartSync = () => {
        if (!connectedDevice) {
            setError('No device connected. Please connect an Android device first.');
            return;
        }
        setConfirmDialogOpen(true);
    };

    const handleConfirmSync = async () => {
        setConfirmDialogOpen(false);

        if (!connectedDevice) {
            setError('No device connected. Please connect an Android device first.');
            return;
        }

        setSyncing(true);
        setError(null);
        setSuccess(null);
        setSyncResults([]);
        setSyncProgress(null);

        try {
            const results = await window.electronAPI.dataSync.syncFromDevice(
                connectedDevice.id,
                databasePath,
                (progress: SyncProgress) => {
                    setSyncProgress(progress);
                },
            );

            setSyncResults(results);

            const totalRecordsInserted = results.reduce(
                (sum, result) => sum + result.recordsInserted,
                0,
            );
            const totalRecordsUpdated = results.reduce(
                (sum, result) => sum + result.recordsUpdated,
                0,
            );
            const failedTables = results.filter((result) => !result.success);
            const productMstResult = results.find((result) => result.tableName === 'product_mst');

            if (failedTables.length === 0) {
                let successMessage = `Data synchronization completed successfully! ${totalRecordsInserted} records inserted, ${totalRecordsUpdated} records updated.`;
                if (productMstResult && productMstResult.success) {
                    successMessage += ` Product box quantities synchronized from product master data.`;
                }
                setSuccess(successMessage);
            } else {
                setError(
                    `Synchronization completed with ${failedTables.length} table(s) having errors. ${totalRecordsInserted} records inserted, ${totalRecordsUpdated} records updated.`,
                );
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to synchronize data from device');
        } finally {
            setSyncing(false);
            setTimeout(() => {
                setSyncProgress(null);
            }, 2000);
        }
    };

    const handleCancelSync = () => {
        setConfirmDialogOpen(false);
    };

    const handleCloseError = () => {
        setError(null);
    };

    const handleCloseSuccess = () => {
        setSuccess(null);
    };

    const getSyncResultIcon = (result: SyncResult) => {
        if (result.success) {
            return <CheckCircle sx={{ color: 'success.main' }} />;
        } else {
            return <ErrorIcon sx={{ color: 'error.main' }} />;
        }
    };

    const getTableIcon = (tableName: string) => {
        switch (tableName) {
            case 'inventory_data':
                return <Inventory sx={{ color: '#2196f3' }} />;
            case 'stockin_data':
                return <TrendingUp sx={{ color: '#4caf50' }} />;
            case 'stockout_data':
                return <TrendingDown sx={{ color: '#f44336' }} />;
            case 'product_mst':
                return <Category sx={{ color: '#ff9800' }} />;
            default:
                return <Storage sx={{ color: '#757575' }} />;
        }
    };

    const getTableDisplayName = (tableName: string): string => {
        switch (tableName) {
            case 'inventory_data':
                return 'Inventory Data';
            case 'stockin_data':
                return 'Stock In Data';
            case 'stockout_data':
                return 'Stock Out Data';
            case 'product_mst':
                return 'Product Master Data';
            default:
                return tableName;
        }
    };

    const getTableDescription = (tableName: string): string => {
        switch (tableName) {
            case 'inventory_data':
                return 'Physical inventory counts and discrepancies';
            case 'stockin_data':
                return 'Stock receipt and incoming inventory records';
            case 'stockout_data':
                return 'Stock issues and outgoing inventory records';
            case 'product_mst':
                return 'Product master data including box quantities';
            default:
                return 'Database synchronization';
        }
    };

    return (
        <>
            <Container maxWidth="lg">
                <Box py={4}>
                    <Typography variant="h3" component="h1" gutterBottom>
                        Get Data from Device
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        Synchronize data from the Android device database to your local database.
                        This will retrieve all inventory, stock movement, and product master records
                        from the device and merge them with your local data.
                    </Typography>

                    {/* Sync Progress */}
                    {syncProgress && (
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={2} mb={2}>
                                    <Storage sx={{ color: 'primary.main' }} />
                                    <Typography variant="h6">
                                        Synchronizing Data:{' '}
                                        {connectedDevice?.model || connectedDevice?.serialNumber}
                                    </Typography>
                                </Box>

                                <Typography variant="body2" color="text.secondary" mb={1}>
                                    Processing {syncProgress.currentTable}:{' '}
                                    {syncProgress.currentRecords} records
                                </Typography>
                                <Typography variant="body2" color="text.secondary" mb={1}>
                                    Table {syncProgress.tablesCompleted + 1} of{' '}
                                    {syncProgress.totalTables}
                                </Typography>

                                <LinearProgress
                                    variant="determinate"
                                    value={syncProgress.overallProgress}
                                    sx={{ mb: 1 }}
                                />

                                <Typography variant="caption" color="text.secondary">
                                    {syncProgress.overallProgress}% complete
                                </Typography>
                            </CardContent>
                        </Card>
                    )}

                    {/* Device Status and Database Configuration */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2} mb={3}>
                                <PhoneAndroid
                                    sx={{ color: connectedDevice ? 'success.main' : 'error.main' }}
                                />
                                <Storage sx={{ color: 'primary.main' }} />
                                <Typography variant="h6">Connection and Configuration</Typography>
                            </Box>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <Box>
                                        <Typography
                                            variant="subtitle1"
                                            color="text.primary"
                                            gutterBottom
                                        >
                                            Device Status
                                        </Typography>
                                        {connectedDevice ? (
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    Connected:{' '}
                                                    {connectedDevice.model ||
                                                        connectedDevice.serialNumber}
                                                </Typography>
                                                <Chip
                                                    label="Ready"
                                                    size="small"
                                                    color="success"
                                                    sx={{ mt: 1 }}
                                                />
                                            </Box>
                                        ) : (
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    No device connected
                                                </Typography>
                                                <Chip
                                                    label="Not Ready"
                                                    size="small"
                                                    color="error"
                                                    sx={{ mt: 1 }}
                                                />
                                            </Box>
                                        )}
                                    </Box>
                                </Grid>

                                <Grid item xs={12} md={8}>
                                    <Box>
                                        <Typography
                                            variant="subtitle1"
                                            color="text.primary"
                                            gutterBottom
                                        >
                                            Database Configuration
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Source Database: {databasePath}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mt: 1 }}
                                        >
                                            Target: Local SQLite Database
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Action Card */}
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
                                        Data Synchronization
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Pull all data from the device database and synchronize with
                                        your local database. This operation will merge records,
                                        update existing data, and sync product box quantities from
                                        the master data.
                                    </Typography>
                                </Box>

                                <Box display="flex" gap={2} flexWrap="wrap">
                                    <Button
                                        variant="outlined"
                                        startIcon={<Refresh />}
                                        onClick={loadImportPath}
                                        disabled={syncing}
                                    >
                                        Refresh Config
                                    </Button>

                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={
                                            syncing ? <CircularProgress size={20} /> : <GetApp />
                                        }
                                        onClick={handleStartSync}
                                        disabled={!connectedDevice || syncing}
                                        size="large"
                                    >
                                        {syncing ? 'Synchronizing...' : 'Start Data Sync'}
                                    </Button>
                                </Box>
                            </Box>

                            <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                                <Chip
                                    label="Inventory Data"
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    icon={<Inventory />}
                                />
                                <Chip
                                    label="Stock In Data"
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    icon={<TrendingUp />}
                                />
                                <Chip
                                    label="Stock Out Data"
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    icon={<TrendingDown />}
                                />
                                <Chip
                                    label="Product Master"
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    icon={<Category />}
                                />
                                <Chip
                                    label="Auto-merge with Local DB"
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                />
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Sync Results */}
                    {syncResults.length > 0 && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Synchronization Results
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Table</TableCell>
                                                <TableCell>Description</TableCell>
                                                <TableCell align="right">Records Found</TableCell>
                                                <TableCell align="right">Inserted</TableCell>
                                                <TableCell align="right">Updated</TableCell>
                                                <TableCell>Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {syncResults.map((result, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Box
                                                            display="flex"
                                                            alignItems="center"
                                                            gap={1}
                                                        >
                                                            {getTableIcon(result.tableName)}
                                                            {getTableDisplayName(result.tableName)}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                        >
                                                            {getTableDescription(result.tableName)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {result.recordsFound}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {result.recordsInserted}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {result.recordsUpdated}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box
                                                            display="flex"
                                                            alignItems="center"
                                                            gap={1}
                                                        >
                                                            {getSyncResultIcon(result)}
                                                            <Typography
                                                                variant="body2"
                                                                color={
                                                                    result.success
                                                                        ? 'success.main'
                                                                        : 'error.main'
                                                                }
                                                            >
                                                                {result.success
                                                                    ? 'Success'
                                                                    : 'Failed'}
                                                            </Typography>
                                                        </Box>
                                                        {result.error && (
                                                            <Typography
                                                                variant="caption"
                                                                color="error"
                                                            >
                                                                {result.error}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    )}
                </Box>
            </Container>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialogOpen} onClose={handleCancelSync} maxWidth="md" fullWidth>
                <DialogTitle>Confirm Data Synchronization</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" paragraph>
                        This will synchronize all data from the device database at:
                    </Typography>
                    <Typography variant="body2" color="primary" paragraph>
                        {databasePath}
                    </Typography>
                    <Typography variant="body1" paragraph>
                        The following tables will be synchronized:
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemIcon>
                                <Inventory color="primary" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Inventory Data"
                                secondary="Physical inventory counts and discrepancies"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <TrendingUp color="success" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Stock In Data"
                                secondary="Stock receipt and incoming inventory records"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <TrendingDown color="error" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Stock Out Data"
                                secondary="Stock issues and outgoing inventory records"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <Category color="warning" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Product Master Data"
                                secondary="Product information including box quantities"
                            />
                        </ListItem>
                    </List>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Existing records will be updated if they already exist in your local
                        database. New records will be inserted. Product box quantities will be
                        synchronized from the master data.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelSync}>Cancel</Button>
                    <Button onClick={handleConfirmSync} variant="contained" autoFocus>
                        Start Synchronization
                    </Button>
                </DialogActions>
            </Dialog>

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
                autoHideDuration={4000}
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