// src/preload.ts - Updated with date filtering service layer IPC handlers
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    getVersions: () => ({
        node: process.versions.node,
        chrome: process.versions.chrome,
        electron: process.versions.electron,
    }),

    getPlatform: () => process.platform,

    // File System APIs for temporary file operations
    fs: {
        writeTemporaryFile: (fileName: string, arrayBuffer: ArrayBuffer) =>
            ipcRenderer.invoke('fs:writeTemporaryFile', fileName, arrayBuffer),
        cleanupTemporaryFile: (filePath: string) =>
            ipcRenderer.invoke('fs:cleanupTemporaryFile', filePath),
    },

    // ADB-related APIs exposed via IPC
    adb: {
        isAvailable: () => ipcRenderer.invoke('adb:isAvailable'),
        listDevices: () => ipcRenderer.invoke('adb:listDevices'),
        getDeviceInfo: (deviceId: string) => ipcRenderer.invoke('adb:getDeviceInfo', deviceId),
        authorizeDevice: (deviceId: string) => ipcRenderer.invoke('adb:authorizeDevice', deviceId),
        listFiles: (deviceId: string, path: string) =>
            ipcRenderer.invoke('adb:listFiles', deviceId, path),
        pullFile: (deviceId: string, remotePath: string, localPath: string) =>
            ipcRenderer.invoke('adb:pullFile', deviceId, remotePath, localPath),
        pushFile: (deviceId: string, localPath: string, remotePath: string) =>
            ipcRenderer.invoke('adb:pushFile', deviceId, localPath, remotePath),
        createDirectory: (deviceId: string, path: string) =>
            ipcRenderer.invoke('adb:createDirectory', deviceId, path),
        deleteFile: (deviceId: string, path: string) =>
            ipcRenderer.invoke('adb:deleteFile', deviceId, path),
    },

    // Settings-related APIs exposed via IPC
    settings: {
        initialize: () => ipcRenderer.invoke('settings:initialize'),
        getSetting: (key: string) => ipcRenderer.invoke('settings:getSetting', key),
        updateSetting: (key: string, value: string) =>
            ipcRenderer.invoke('settings:updateSetting', key, value),
        getAllSettings: () => ipcRenderer.invoke('settings:getAllSettings'),
        deleteSetting: (key: string) => ipcRenderer.invoke('settings:deleteSetting', key),
    },

    // Data Import APIs exposed via IPC
    import: {
        parseFile: (filePath: string) => ipcRenderer.invoke('import:parseFile', filePath),
        importData: (csvData: any[], fileType: string) =>
            ipcRenderer.invoke('import:importData', csvData, fileType),
        detectFileType: (headers: string[]) => ipcRenderer.invoke('import:detectFileType', headers),
    },

    // Data Synchronization APIs exposed via IPC
    dataSync: {
        syncFromDevice: (
            deviceId: string,
            remoteDatabasePath: string,
            progressCallback?: (progress: any) => void,
        ) => {
            // Set up progress listener if callback provided
            if (progressCallback) {
                const handleProgress = (event: any, progress: any) => {
                    progressCallback(progress);
                };
                ipcRenderer.on('dataSync:progress', handleProgress);

                // Return a promise that cleans up the listener
                return ipcRenderer
                    .invoke('dataSync:syncFromDevice', deviceId, remoteDatabasePath)
                    .finally(() => {
                        ipcRenderer.removeListener('dataSync:progress', handleProgress);
                    });
            }

            return ipcRenderer.invoke('dataSync:syncFromDevice', deviceId, remoteDatabasePath);
        },
    },

    // Data Query APIs exposed via IPC - Updated with date filtering capabilities
    data: {
        // Individual entity access (maintained for backward compatibility)
        getAllProducts: () => ipcRenderer.invoke('data:getAllProducts'),
        getAllLocations: () => ipcRenderer.invoke('data:getAllLocations'),
        getAllStaff: () => ipcRenderer.invoke('data:getAllStaff'),
        getAllSuppliers: () => ipcRenderer.invoke('data:getAllSuppliers'),
        
        // Individual count access (maintained for backward compatibility)
        getInventoryDataCount: () => ipcRenderer.invoke('data:getInventoryDataCount'),
        getStockinDataCount: () => ipcRenderer.invoke('data:getStockinDataCount'),
        getStockoutDataCount: () => ipcRenderer.invoke('data:getStockoutDataCount'),
        
        // Aggregated service operations
        getDataCounts: () => ipcRenderer.invoke('data:getDataCounts'),
        getAllMasterData: () => ipcRenderer.invoke('data:getAllMasterData'),

        // NEW: Date-filtered data operations
        getInventoryDataByDateRange: (fromDate: string, toDate: string) =>
            ipcRenderer.invoke('data:getInventoryDataByDateRange', fromDate, toDate),
        getStockinDataByDateRange: (fromDate: string, toDate: string) =>
            ipcRenderer.invoke('data:getStockinDataByDateRange', fromDate, toDate),
        getStockoutDataByDateRange: (fromDate: string, toDate: string) =>
            ipcRenderer.invoke('data:getStockoutDataByDateRange', fromDate, toDate),
        getDataCountsByDateRange: (fromDate: string, toDate: string) =>
            ipcRenderer.invoke('data:getDataCountsByDateRange', fromDate, toDate),
        getTransactionDataByDateRange: (fromDate: string, toDate: string) =>
            ipcRenderer.invoke('data:getTransactionDataByDateRange', fromDate, toDate),
    },
});