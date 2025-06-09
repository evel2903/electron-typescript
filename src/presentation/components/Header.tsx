// src/presentation/components/Header.tsx
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Tabs,
  Tab,
  Button,
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
  Chip,
  CircularProgress,
  Typography
} from '@mui/material';
import { 
  PhoneAndroid, 
  Refresh, 
  CheckCircle, 
  Warning,
  Error as ErrorIcon
} from '@mui/icons-material';
import { AndroidDevice } from '@/domain/entities/AndroidDevice';
import { DIContainer } from '@/application/services/DIContainer';

interface HeaderProps {
  currentTab: number;
  onTabChange: (newValue: number) => void;
  onDeviceSelected?: (device: AndroidDevice) => void;
  connectedDevice?: AndroidDevice | null;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentTab, 
  onTabChange, 
  onDeviceSelected,
  connectedDevice
}) => {
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
          setDevices(prev => prev.map(d => 
            d.id === device.id ? authorizedDevice : d
          ));
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    onTabChange(newValue);
  };

  return (
    <>
      <AppBar position="static" sx={{ minHeight: 'auto' }}>
        <Toolbar 
          sx={{ 
            minHeight: '56px !important',
            height: '56px',
            paddingY: 0,
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            sx={{
              minHeight: '56px',
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                minHeight: '56px',
                paddingX: 3,
                '&.Mui-selected': {
                  color: 'white'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: 'white'
              }
            }}
          >
            <Tab label="Tab 1" />
            <Tab label="Tab 2" />
          </Tabs>
          
          <Box display="flex" alignItems="center" gap={2}>
            {connectedDevice && (
              <Chip
                icon={<CheckCircle sx={{ color: 'white !important' }} />}
                label={connectedDevice.model !== 'Unknown' ? connectedDevice.model : connectedDevice.serialNumber}
                size="small"
                sx={{
                  backgroundColor: 'rgba(76, 175, 80, 0.8)',
                  color: 'white',
                  '& .MuiChip-icon': {
                    color: 'white !important'
                  }
                }}
              />
            )}
            
            <Button
              color="inherit"
              onClick={handleScanDevices}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PhoneAndroid />}
              variant="outlined"
              size="small"
              sx={{ 
                borderColor: 'rgba(255, 255, 255, 0.3)',
                height: '36px',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              {loading ? 'Scanning...' : connectedDevice ? 'Reconnect Device' : 'Connect Device'}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

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
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
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
                  <ListItemIcon>
                    {getStatusIcon(device)}
                  </ListItemIcon>
                  <ListItemText
                    primary={device.model !== 'Unknown' ? device.model : device.serialNumber}
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
                            variant={device.isAuthorized ? 'filled' : 'outlined'}
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
          <Button onClick={() => setDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};