// src/presentation/components/AndroidDeviceCard.tsx
import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Alert,
    IconButton,
} from '@mui/material';
import {
    PhoneAndroid,
    Refresh,
    CheckCircle,
    Warning,
    Error as ErrorIcon,
} from '@mui/icons-material';
import { AndroidDevice } from '@/domain/entities/AndroidDevice';
import { DIContainer } from '@/application/services/DIContainer';

interface AndroidDeviceCardProps {
    onDeviceSelected?: (device: AndroidDevice) => void;
}

export const AndroidDeviceCard: React.FC<AndroidDeviceCardProps> = ({ onDeviceSelected }) => {
    const [devices, setDevices] = useState<AndroidDevice[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [connecting, setConnecting] = useState<string | null>(null);

    const androidDeviceService = DIContainer.getInstance().getAndroidDeviceService();

    const handleScanDevices = async () => {
        setLoading(true);
        setError(null);

        try {
            const connectedDevices = await androidDeviceService.getConnectedDevices();
            setDevices(connectedDevices);
            setDialogOpen(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to scan for devices');
        } finally {
            setLoading(false);
        }
    };

    const handleConnectToDevice = async (device: AndroidDevice) => {
        setConnecting(device.id);

        try {
            if (!device.isAuthorized) {
                const authorizedDevice = await androidDeviceService.connectToDevice(device.id);
                if (authorizedDevice) {
                    setDevices((prev) =>
                        prev.map((d) => (d.id === device.id ? authorizedDevice : d)),
                    );
                    onDeviceSelected?.(authorizedDevice);
                }
            } else {
                onDeviceSelected?.(device);
            }
            setDialogOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to connect to device');
        } finally {
            setConnecting(null);
        }
    };

    const getStatusIcon = (device: AndroidDevice) => {
        if (connecting === device.id) {
            return <CircularProgress size={20} />;
        }

        switch (device.status) {
            case 'device':
                return <CheckCircle sx={{ color: 'success.main' }} />;
            case 'unauthorized':
                return <Warning sx={{ color: 'warning.main' }} />;
            case 'offline':
            case 'no permissions':
                return <ErrorIcon sx={{ color: 'error.main' }} />;
            default:
                return <PhoneAndroid />;
        }
    };

    const getStatusColor = (status: AndroidDevice['status']) => {
        switch (status) {
            case 'device':
                return 'success';
            case 'unauthorized':
                return 'warning';
            case 'offline':
            case 'no permissions':
                return 'error';
            default:
                return 'default';
        }
    };

    return (
        <>
            <Card sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
                <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Box display="flex" alignItems="center">
                            <PhoneAndroid sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h5" component="h2">
                                Android Device Connection
                            </Typography>
                        </Box>
                        <IconButton onClick={handleScanDevices} disabled={loading}>
                            <Refresh />
                        </IconButton>
                    </Box>

                    <Typography variant="body2" color="text.secondary" paragraph>
                        Connect to your Android device via USB to transfer files. Ensure USB
                        debugging is enabled on your device.
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Button
                        variant="contained"
                        onClick={handleScanDevices}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <PhoneAndroid />}
                        fullWidth
                    >
                        {loading ? 'Scanning for Devices...' : 'Connect to Android Device'}
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        Connected Android Devices
                        <IconButton onClick={handleScanDevices} disabled={loading}>
                            <Refresh />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {devices.length === 0 ? (
                        <Alert severity="info">
                            No Android devices found. Please ensure:
                            <br />• Your device is connected via USB
                            <br />• USB debugging is enabled
                            <br />• Device drivers are installed
                            <br />• ADB is properly configured
                        </Alert>
                    ) : (
                        <List>
                            {devices.map((device) => (
                                <ListItem
                                    key={device.id}
                                    button
                                    onClick={() => handleConnectToDevice(device)}
                                    disabled={connecting === device.id}
                                >
                                    <ListItemIcon>{getStatusIcon(device)}</ListItemIcon>
                                    <ListItemText
                                        primary={
                                            device.model !== 'Unknown'
                                                ? device.model
                                                : device.serialNumber
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    Serial: {device.serialNumber}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Product: {device.product}
                                                </Typography>
                                                <Box mt={1}>
                                                    <Chip
                                                        label={device.status}
                                                        size="small"
                                                        color={getStatusColor(device.status) as any}
                                                        variant={
                                                            device.isAuthorized
                                                                ? 'filled'
                                                                : 'outlined'
                                                        }
                                                    />
                                                </Box>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
