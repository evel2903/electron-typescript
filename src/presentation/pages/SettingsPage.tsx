// src/presentation/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Chip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DIContainer } from '@/application/services/DIContainer';
import { Setting } from '@/domain/entities/Setting';
import { SETTING_KEYS, SETTING_LABELS, SETTING_DESCRIPTIONS, SettingKey } from '@/shared/constants/settings';

interface SettingFormData {
  [key: string]: string;
}

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [formData, setFormData] = useState<SettingFormData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const settingService = DIContainer.getInstance().getSettingService();

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const allSettings = await settingService.getAllSettings();
      setSettings(allSettings);
      
      // Initialize form data with current settings values
      const newFormData: SettingFormData = {};
      Object.values(SETTING_KEYS).forEach((key: SettingKey) => {
        const setting = allSettings.find(s => s.key === key);
        newFormData[key] = setting ? setting.value : '';
      });
      setFormData(newFormData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
    // Clear success message when user starts editing
    if (success) {
      setSuccess(null);
    }
  };

  const handleSaveSetting = async (key: SettingKey) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const value = formData[key] || '';
      await settingService.updateSetting(key, value);
      
      // Reload settings to get updated data
      await loadSettings();
      setSuccess(`${SETTING_LABELS[key]} saved successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAllSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const promises = Object.values(SETTING_KEYS).map(async (key: SettingKey) => {
        const value = formData[key] || '';
        return settingService.updateSetting(key, value);
      });
      
      await Promise.all(promises);
      await loadSettings();
      setSuccess('All settings saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };



  const getSettingIcon = (key: SettingKey) => {
    return <SettingsIcon sx={{ color: 'primary.main' }} />;
  };

  const formatLastUpdated = (setting: Setting | undefined): string => {
    if (!setting) return 'Never set';
    return setting.updatedAt.toLocaleString();
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box py={4} display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={40} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
          <Box display="flex" alignItems="center">
            <SettingsIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h3" component="h1">
                Settings
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Configure application preferences and default values
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadSettings}
              disabled={saving}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSaveAllSettings}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save All'}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {Object.values(SETTING_KEYS).map((key: SettingKey) => {
            const setting = settings.find(s => s.key === key);
            
            return (
              <Grid item xs={12} key={key}>
                <Card elevation={1}>
                  <CardContent>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <Box sx={{ mt: 1 }}>
                        {getSettingIcon(key)}
                      </Box>
                      
                      <Box flexGrow={1}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                          <Box>
                            <Typography variant="h6" component="h3">
                              {SETTING_LABELS[key]}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {SETTING_DESCRIPTIONS[key]}
                            </Typography>
                          </Box>
                          
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={`Last updated: ${formatLastUpdated(setting)}`}
                              size="small"
                              variant="outlined"
                              color={setting ? 'primary' : 'default'}
                            />
                          </Box>
                        </Box>
                        
                        <Box display="flex" gap={2} alignItems="flex-end">
                          <TextField
                            fullWidth
                            variant="outlined"
                            size="medium"
                            value={formData[key] || ''}
                            onChange={(e) => handleInputChange(key, e.target.value)}
                            placeholder={`Enter ${SETTING_LABELS[key].toLowerCase()}`}
                            helperText={setting ? `Current value: ${setting.value || 'Not set'}` : 'Not configured'}
                          />
                          
                          <Button
                            variant="contained"
                            size="medium"
                            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                            onClick={() => handleSaveSetting(key)}
                            disabled={saving}
                            sx={{ minWidth: 100 }}
                          >
                            {saving ? 'Saving' : 'Save'}
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Paper elevation={0} sx={{ p: 3, backgroundColor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            About Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Settings are automatically saved to a local SQLite database. Changes take effect immediately 
            and persist across application restarts. All timestamps are displayed in your local timezone.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            To add new settings, update the SETTING_KEYS constant in the settings configuration file.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};