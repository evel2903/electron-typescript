// src/presentation/pages/HomePage.tsx - Updated with ProductStatusPage
import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { Header } from '../components/Header';
import { ImportPage } from './ImportPage';
import { GetDataPage } from './GetDataPage';
import { ReportsPage } from './ReportsPage';
import { ProductStatusPage } from './ProductStatusPage';
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
                return <GetDataPage connectedDevice={selectedDevice} />;
            case 2:
                return <ReportsPage />;
            case 3:
                return <ProductStatusPage />;
            case 4:
                return <Tab2Page />;
            case 5:
                return <SettingsPage />;
            default:
                return <ImportPage connectedDevice={selectedDevice} />;
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {/* Fixed Header */}
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1100, // Ensure header stays above other content
                    backgroundColor: 'background.paper',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    height: '56px',
                }}
            >
                <Header
                    currentTab={currentTab}
                    onTabChange={handleTabChange}
                    onDeviceSelected={handleDeviceSelected}
                    connectedDevice={selectedDevice}
                />
            </Box>

            {/* Main Content Area */}
            <Box
                sx={{
                    flex: 1,
                    marginTop: '56px',
                    overflow: 'auto',
                    paddingBottom: '40px', // Space for footer
                }}
            >
                {renderCurrentPage()}
            </Box>

            {/* Fixed Footer at Bottom */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '8px 16px',
                    textAlign: 'center',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.paper',
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}
            >
                Copyright © 2025{' '}
                <a
                    href="https://www.k-s-s.com.vn/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: 'inherit',
                        textDecoration: 'none',
                        marginLeft: '4px',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = 'none';
                    }}
                >
                    KSS Software Saigon
                </a>
            </Box>
        </Box>
    );
};