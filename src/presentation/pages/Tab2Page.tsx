// src/presentation/pages/Tab2Page.tsx
import React from 'react';
import { Container, Typography, Box, Paper, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Storage, Folder, FileCopy, Timeline } from '@mui/icons-material';

export const Tab2Page: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          Tab 2 - File Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This section handles file operations and device storage management for connected Android devices.
        </Typography>

        <Paper elevation={1} sx={{ mb: 3 }}>
          <Box p={3}>
            <Typography variant="h5" gutterBottom>
              Storage Overview
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Monitor and manage storage usage across connected devices. View available space and organize files efficiently.
            </Typography>
            
            <Box mt={2}>
              <Typography variant="h6" color="primary">
                Device Storage Status
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No devices currently connected. Connect an Android device to view storage information.
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper elevation={1}>
          <Box p={3}>
            <Typography variant="h5" gutterBottom>
              Available Operations
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Folder color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Browse Device Folders"
                  secondary="Navigate through the file system of connected Android devices"
                />
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemIcon>
                  <FileCopy color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="File Transfer"
                  secondary="Upload and download files between your computer and Android device"
                />
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemIcon>
                  <Storage color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Storage Management"
                  secondary="Monitor storage usage and manage available space on devices"
                />
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemIcon>
                  <Timeline color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Transfer History"
                  secondary="View history of file transfers and operations performed"
                />
              </ListItem>
            </List>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};