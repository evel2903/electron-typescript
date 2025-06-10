// src/presentation/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { Header } from '../components/Header';
import { ImportPage } from './ImportPage';
import { Tab2Page } from './Tab2Page';
import { SettingsPage } from './SettingsPage';
import { DIContainer } from '@/application/services/DIContainer';
import { ElectronAPIService } from '@/infrastructure/services/ElectronAPIService';
import { AndroidDevice } from '@/domain/entities/AndroidDevice';

export const HomePage: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<AndroidDevice | null>(null);
  const [currentTab, setCurrentTab] = useState<number>(0);

  useEffect(() => {
    // Initialize settings database when app starts
    const initializeSettings = async () => {
      try {
        const settingService = DIContainer.getInstance().getSettingService();
        await settingService.getAllSettings(); // This will trigger initialization
      } catch (error) {
        console.error('Failed to initialize settings:', error);
      }
    };

    initializeSettings();
  }, []);

  const handleDeviceSelected = (device: AndroidDevice) => {
    setSelectedDevice(device);
  };

  const handleTabChange = (newValue: number) => {
    setCurrentTab(newValue);
  };

  const renderCurrentPage = () => {
    switch (currentTab) {
      case 0:
        return <ImportPage />;
      case 1:
        return <Tab2Page />;
      case 2:
        return <SettingsPage />;
      default:
        return <ImportPage />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header 
        currentTab={currentTab} 
        onTabChange={handleTabChange}
        onDeviceSelected={handleDeviceSelected}
        connectedDevice={selectedDevice}
      />
      
      <Box sx={{ flexGrow: 1 }}>
        {renderCurrentPage()}
      </Box>
    </Box>
  );
};