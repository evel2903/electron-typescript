// src/presentation/components/SystemInfoCard.tsx
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress
} from '@mui/material';
import { Info } from '@mui/icons-material';

interface SystemInfoProps {
  appInfo: {
    name: string;
    version: string;
    description: string;
    environment: string;
  } | null;
  systemInfo: {
    nodeVersion: string;
    chromeVersion: string;
    electronVersion: string;
  } | null;
  loading: boolean;
}

export const SystemInfoCard: React.FC<SystemInfoProps> = ({
  appInfo,
  systemInfo,
  loading
}) => {
  return (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Info sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" component="h2">
            System Information
          </Typography>
        </Box>
        
        {loading ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            {appInfo && (
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Application Details
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {appInfo.description}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip label={`Version: ${appInfo.version}`} size="small" />
                  <Chip 
                    label={`Environment: ${appInfo.environment}`} 
                    size="small" 
                    color={appInfo.environment === 'production' ? 'success' : 'warning'} 
                  />
                </Box>
              </Box>
            )}
            
            {systemInfo && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Runtime Versions
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip label={`Node.js: ${systemInfo.nodeVersion}`} variant="outlined" size="small" />
                  <Chip label={`Chrome: ${systemInfo.chromeVersion}`} variant="outlined" size="small" />
                  <Chip label={`Electron: ${systemInfo.electronVersion}`} variant="outlined" size="small" />
                </Box>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
