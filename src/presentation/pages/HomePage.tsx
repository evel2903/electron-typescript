// src/presentation/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { Box, Alert } from '@mui/material';
import { Header } from '../components/Header';
import { Tab1Page } from './Tab1Page';
import { Tab2Page } from './Tab2Page';
import { DIContainer } from '@/application/services/DIContainer';
import { ElectronAPIService } from '@/infrastructure/services/ElectronAPIService';
import { AndroidDevice } from '@/domain/entities/AndroidDevice';

export const HomePage: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<AndroidDevice | null>(null);
  const [currentTab, setCurrentTab] = useState<number>(0);

  const handleDeviceSelected = (device: AndroidDevice) => {
    setSelectedDevice(device);
  };

  const handleTabChange = (newValue: number) => {
    setCurrentTab(newValue);
  };

  const renderCurrentPage = () => {
    switch (currentTab) {
      case 0:
        return <Tab1Page />;
      case 1:
        return <Tab2Page />;
      default:
        return <Tab1Page />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header 
        currentTab={currentTab} 
        onTabChange={handleTabChange}
        onDeviceSelected={handleDeviceSelected}
      />
      
      <Box sx={{ flexGrow: 1 }}>
        {selectedDevice && (
          <Alert severity="success" sx={{ mx: 2, mt: 2 }}>
            Successfully connected to {selectedDevice.model} ({selectedDevice.serialNumber})
          </Alert>
        )}
        
        {renderCurrentPage()}
      </Box>
    </Box>
  );
};