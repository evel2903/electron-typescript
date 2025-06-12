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
    Snackbar,
    Alert,
    CircularProgress,
    Grid,
    Divider,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
} from '@mui/material';
import {
    Settings as SettingsIcon,
    Save,
    Refresh,
    FolderOpen,
    RestoreRounded,
} from '@mui/icons-material';
import { Setting } from '@/domain/entities/Setting';
import { SETTING_DEFINITIONS, SETTING_KEYS, SettingKey } from '@/shared/constants/settings';
import { DIContainer } from '@/application/services/DIContainer';

export const SettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<Setting[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [values, setValues] = useState<Record<SettingKey, string>>(
        {} as Record<SettingKey, string>,
    );
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [selectedDirectory, setSelectedDirectory] = useState<string>('');

    const settingService = DIContainer.getInstance().getSettingService();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        setError(null);

        try {
            const allSettings = await settingService.getAllSettings();
            setSettings(allSettings);

            const valuesMap: Record<SettingKey, string> = {} as Record<SettingKey, string>;
            allSettings.forEach((setting) => {
                valuesMap[setting.key] = setting.value;
            });
            setValues(valuesMap);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (key: SettingKey) => {
        setSaving(key);
        setError(null);
        setSuccess(null);

        try {
            const value = values[key] || '';
            await settingService.updateSetting(key, value);
            setSuccess(`Setting '${SETTING_DEFINITIONS[key].label}' saved successfully`);

            // Refresh the settings to get updated timestamps
            await loadSettings();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save setting');
        } finally {
            setSaving(null);
        }
    };

    const handleValueChange = (key: SettingKey, value: string) => {
        setValues((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleDirectorySelect = () => {
        // In a real implementation, this would open a native directory picker
        // For now, we'll use a simple dialog
        setDialogOpen(true);
    };

    const handleDirectoryConfirm = () => {
        if (selectedDirectory) {
            handleValueChange(SETTING_KEYS.FILE_IMPORT_PATH, selectedDirectory);
        }
        setDialogOpen(false);
        setSelectedDirectory('');
    };

    const handleCloseError = () => {
        setError(null);
    };

    const handleCloseSuccess = () => {
        setSuccess(null);
    };

    const formatDateTime = (date: Date): string => {
        return date.toLocaleString();
    };

    const renderSettingControl = (
        key: SettingKey,
        definition: (typeof SETTING_DEFINITIONS)[SettingKey],
    ) => {
        const currentValue = values[key] || '';
        const setting = settings.find((s) => s.key === key);

        return (
            <Card key={key} sx={{ mb: 2 }}>
                <CardContent>
                    <Box display="flex" flexDirection="column" gap={2}>
                        <Box>
                            <Typography variant="h6" component="h3">
                                {definition.label}
                                {definition.required && (
                                    <Typography component="span" color="error" sx={{ ml: 1 }}>
                                        *
                                    </Typography>
                                )}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {definition.description}
                            </Typography>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1}>
                            <TextField
                                fullWidth
                                value={currentValue}
                                onChange={(e) => handleValueChange(key, e.target.value)}
                                placeholder={
                                    definition.defaultValue ||
                                    `Enter ${definition.label.toLowerCase()}`
                                }
                                variant="outlined"
                                size="small"
                                disabled={saving === key}
                                InputProps={{
                                    endAdornment: definition.type === 'directory' && (
                                        <IconButton
                                            onClick={handleDirectorySelect}
                                            size="small"
                                            disabled={saving === key}
                                        >
                                            <FolderOpen />
                                        </IconButton>
                                    ),
                                }}
                            />

                            <Button
                                variant="contained"
                                onClick={() => handleSave(key)}
                                disabled={saving === key || loading}
                                startIcon={
                                    saving === key ? <CircularProgress size={16} /> : <Save />
                                }
                                sx={{ minWidth: 100 }}
                            >
                                {saving === key ? 'Saving...' : 'Save'}
                            </Button>
                        </Box>

                        {setting && (
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Last updated: {formatDateTime(setting.updatedAt)}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </CardContent>
            </Card>
        );
    };

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box py={4} display="flex" justify-content="center">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <>
            <Container maxWidth="lg">
                <Box py={4}>
                    {/* Header */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
                        <Box display="flex" alignItems="center">
                            <SettingsIcon sx={{ mr: 2, color: 'primary.main' }} />
                            <Typography variant="h3" component="h1">
                                Settings
                            </Typography>
                        </Box>

                        <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={loadSettings}
                            disabled={loading}
                        >
                            Refresh
                        </Button>
                    </Box>

                    {/* Settings Form */}
                    <Typography variant="h5" gutterBottom>
                        Application Settings
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        Configure your application preferences and default values.
                    </Typography>

                    <Box mt={3}>
                        {Object.entries(SETTING_DEFINITIONS).map(([key, definition]) =>
                            renderSettingControl(key as SettingKey, definition),
                        )}
                    </Box>

                    {/* Settings Summary */}
                    <Card sx={{ mt: 4 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Settings Summary
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <List dense>
                                {Object.entries(SETTING_DEFINITIONS).map(([key, definition]) => {
                                    const setting = settings.find((s) => s.key === key);
                                    const value = values[key as SettingKey] || '';

                                    return (
                                        <ListItem key={key}>
                                            <ListItemText
                                                primary={definition.label}
                                                secondary={value || 'Not configured'}
                                            />
                                            <ListItemSecondaryAction>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    {setting
                                                        ? formatDateTime(setting.updatedAt)
                                                        : 'Never'}
                                                </Typography>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </CardContent>
                    </Card>
                </Box>
            </Container>

            {/* Directory Selection Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Select Directory</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Enter the path to your preferred directory for file imports:
                    </Typography>
                    <TextField
                        fullWidth
                        label="Directory Path"
                        value={selectedDirectory}
                        onChange={(e) => setSelectedDirectory(e.target.value)}
                        placeholder="e.g., C:\Downloads or /home/user/downloads"
                        variant="outlined"
                        autoFocus
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDirectoryConfirm} variant="contained">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Error Snackbar */}
            <Snackbar
                open={!!error}
                autoHideDuration={2000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            {/* Success Snackbar */}
            <Snackbar
                open={!!success}
                autoHideDuration={2000}
                onClose={handleCloseSuccess}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
                    {success}
                </Alert>
            </Snackbar>
        </>
    );
};
