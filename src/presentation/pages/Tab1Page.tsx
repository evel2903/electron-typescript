// src/presentation/pages/Tab1Page.tsx
import React from 'react';
import { Container, Typography, Box, Paper, Grid, Card, CardContent } from '@mui/material';
import { Build, Settings, Dashboard } from '@mui/icons-material';

export const Tab1Page: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          Tab 1 - Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Welcome to the main dashboard section of the application. This page demonstrates the first tab functionality.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Dashboard color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Overview
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  This section provides an overview of the application status and key metrics.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Build color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Tools
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Access various tools and utilities for device management and file operations.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Settings color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Configuration
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Configure application settings and device connection preferences.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper elevation={1} sx={{ mt: 4, p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Recent Activity
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This section would typically display recent user activities, connected devices, and file transfer history.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};