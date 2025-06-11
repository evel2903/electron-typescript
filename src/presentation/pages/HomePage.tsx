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
        return <ImportPage connectedDevice={selectedDevice} />;
      case 1:
        return <Tab2Page />;
      case 2:
        return <SettingsPage />;
      default:
        return <ImportPage connectedDevice={selectedDevice} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Fixed Header */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100, // Ensure header stays above other content
          backgroundColor: 'background.paper',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <Header 
          currentTab={currentTab} 
          onTabChange={handleTabChange}
          onDeviceSelected={handleDeviceSelected}
          connectedDevice={selectedDevice}
        />
      </Box>
      
      {/* Main Content Area with Top Margin */}
      <Box 
        sx={{ 
          flexGrow: 1,
          marginTop: '56px', // Account for header height
          minHeight: 'calc(100vh - 56px)'
        }}
      >
        {renderCurrentPage()}
      </Box>
    </Box>
  );
};