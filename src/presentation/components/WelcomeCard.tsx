// src/presentation/components/WelcomeCard.tsx
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { WavingHand } from '@mui/icons-material';

interface WelcomeCardProps {
  message: string;
  loading: boolean;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({ message, loading }) => {
  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <WavingHand sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" component="h2">
            Welcome Message
          </Typography>
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary">
            {message}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};