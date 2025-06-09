// src/presentation/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { Container, Typography, Box } from '@mui/material';
import { WelcomeCard } from '../components/WelcomeCard';
import { SystemInfoCard } from '../components/SystemInfoCard';
import { DIContainer } from '@/application/services/DIContainer';
import { ElectronAPIService } from '@/infrastructure/services/ElectronAPIService';

export const HomePage: React.FC = () => {
  const [welcomeMessage, setWelcomeMessage] = useState<string>('');
  const [appInfo, setAppInfo] = useState<any>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const electronAPI = new ElectronAPIService();
        const appService = DIContainer.getInstance().getAppService(electronAPI);
        
        const [message, information] = await Promise.all([
          appService.getWelcomeMessage(),
          appService.getAppInformation()
        ]);

        setWelcomeMessage(message);
        setAppInfo(information.appInfo);
        setSystemInfo(information.systemInfo);
      } catch (error) {
        console.error('Failed to load application data:', error);
        setWelcomeMessage('Hello, World! Welcome to our Clean Architecture Electron App.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Typography variant="h1" component="h1" align="center" gutterBottom>
          Clean Architecture Demo
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" paragraph>
          This application demonstrates Clean Architecture principles in an Electron environment using TypeScript and Material-UI.
        </Typography>
        
        <WelcomeCard message={welcomeMessage} loading={loading} />
        <SystemInfoCard 
          appInfo={appInfo} 
          systemInfo={systemInfo} 
          loading={loading} 
        />
      </Box>
    </Container>
  );
};