// src/infrastructure/services/AdbService.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { AndroidDevice } from '@/domain/entities/AndroidDevice';
import { DeviceFile } from '@/domain/entities/DeviceFile';
import { FileTransferResult } from '@/domain/entities/FileTransferResult';

const execAsync = promisify(exec);

export class AdbService {
  private adbPath: string;

  constructor() {
    this.adbPath = this.resolveAdbPath();
    console.log(`ADB Service initialized with path: ${this.adbPath}`);
  }

  private resolveAdbPath(): string {
    const isDev = process.env.NODE_ENV === 'development';
    console.log(`Environment: ${isDev ? 'development' : 'production'}`);
    console.log(`Current __dirname: ${__dirname}`);
    
    let basePath: string;
    
    if (isDev) {
      // In development, we need to go up from dist/infrastructure/services/ to project root
      basePath = path.join(__dirname, '../');
    } else {
      // In production, use the application directory
      basePath = path.dirname(process.execPath);
    }
    
    console.log(`Base path resolved to: ${basePath}`);
    
    // Construct the platform-tools path
    const platformToolsPath = path.join(basePath, 'tools', 'platform-tools');
    console.log(`Platform tools path: ${platformToolsPath}`);
    
    // Determine the correct executable name for the platform
    const adbExecutable = process.platform === 'win32' ? 'adb.exe' : 'adb';
    const fullAdbPath = path.join(platformToolsPath, adbExecutable);
    
    console.log(`Full ADB path: ${fullAdbPath}`);
    
    // Verify that the directory and file exist
    if (!fs.existsSync(platformToolsPath)) {
      console.error(`Platform tools directory does not exist: ${platformToolsPath}`);
      console.log('Please ensure you have extracted platform-tools to the tools/ directory in your project root.');
    }
    
    if (!fs.existsSync(fullAdbPath)) {
      console.error(`ADB executable does not exist: ${fullAdbPath}`);
      console.log('Available files in platform-tools directory:');
      try {
        const files = fs.readdirSync(platformToolsPath);
        files.forEach(file => console.log(`  - ${file}`));
      } catch (error) {
        console.log('Could not read platform-tools directory');
      }
    }
    
    return fullAdbPath;
  }

  async isAdbAvailable(): Promise<boolean> {
    try {
      // Check if the bundled ADB file exists
      if (!fs.existsSync(this.adbPath)) {
        console.error(`ADB executable not found at: ${this.adbPath}`);
        return false;
      }
      
      // Test ADB execution
      const { stdout } = await execAsync(`"${this.adbPath}" version`);
      console.log(`ADB version check successful: ${stdout.trim()}`);
      return true;
    } catch (error) {
      console.error('ADB version check failed:', error);
      return false;
    }
  }

  async listDevices(): Promise<AndroidDevice[]> {
    try {
      const { stdout } = await execAsync(`"${this.adbPath}" devices -l`);
      const lines = stdout.split('\n').filter(line => line.trim() && !line.includes('List of devices'));
      
      const devices: AndroidDevice[] = [];
      
      for (const line of lines) {
        const device = this.parseDeviceLine(line);
        if (device) {
          devices.push(device);
        }
      }
      
      return devices;
    } catch (error) {
      console.error('Error listing devices:', error);
      return [];
    }
  }

  async getDeviceInfo(deviceId: string): Promise<AndroidDevice | null> {
    const devices = await this.listDevices();
    return devices.find(device => device.id === deviceId) || null;
  }

  async authorizeDevice(deviceId: string): Promise<boolean> {
    try {
      // Wait for device authorization - this typically requires user interaction on the device
      await execAsync(`"${this.adbPath}" -s ${deviceId} wait-for-device`);
      return true;
    } catch (error) {
      console.error('Error authorizing device:', error);
      return false;
    }
  }

  async listFiles(deviceId: string, path: string): Promise<DeviceFile[]> {
    try {
      const { stdout } = await execAsync(`"${this.adbPath}" -s ${deviceId} shell ls -la "${path}"`);
      return this.parseFileList(stdout);
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  async pullFile(deviceId: string, remotePath: string, localPath: string): Promise<FileTransferResult> {
    try {
      const startTime = Date.now();
      await execAsync(`"${this.adbPath}" -s ${deviceId} pull "${remotePath}" "${localPath}"`);
      
      const stats = fs.statSync(localPath);
      const transferTime = Date.now() - startTime;
      
      return {
        success: true,
        message: `File transferred successfully in ${transferTime}ms`,
        transferredBytes: stats.size
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to transfer file from device',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async pushFile(deviceId: string, localPath: string, remotePath: string): Promise<FileTransferResult> {
    try {
      const stats = fs.statSync(localPath);
      const startTime = Date.now();
      
      await execAsync(`"${this.adbPath}" -s ${deviceId} push "${localPath}" "${remotePath}"`);
      
      const transferTime = Date.now() - startTime;
      
      return {
        success: true,
        message: `File transferred successfully in ${transferTime}ms`,
        transferredBytes: stats.size
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to transfer file to device',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createDirectory(deviceId: string, path: string): Promise<boolean> {
    try {
      await execAsync(`"${this.adbPath}" -s ${deviceId} shell mkdir -p "${path}"`);
      return true;
    } catch (error) {
      console.error('Error creating directory:', error);
      return false;
    }
  }

  async deleteFile(deviceId: string, path: string): Promise<boolean> {
    try {
      await execAsync(`"${this.adbPath}" -s ${deviceId} shell rm -rf "${path}"`);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  private parseDeviceLine(line: string): AndroidDevice | null {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) return null;

    const serialNumber = parts[0];
    const status = parts[1] as AndroidDevice['status'];
    
    // Parse additional device info from the line
    let model = 'Unknown';
    let product = 'Unknown';
    let device = 'Unknown';
    let transportId = 'Unknown';

    const detailsPart = parts.slice(2).join(' ');
    const modelMatch = detailsPart.match(/model:(\S+)/);
    const productMatch = detailsPart.match(/product:(\S+)/);
    const deviceMatch = detailsPart.match(/device:(\S+)/);
    const transportMatch = detailsPart.match(/transport_id:(\S+)/);

    if (modelMatch) model = modelMatch[1];
    if (productMatch) product = productMatch[1];
    if (deviceMatch) device = deviceMatch[1];
    if (transportMatch) transportId = transportMatch[1];

    return {
      id: serialNumber,
      model,
      product,
      device,
      transportId,
      status,
      serialNumber,
      isAuthorized: status === 'device'
    };
  }

  private parseFileList(output: string): DeviceFile[] {
    const lines = output.split('\n').filter(line => line.trim());
    const files: DeviceFile[] = [];

    for (const line of lines) {
      const file = this.parseFileLine(line);
      if (file) {
        files.push(file);
      }
    }

    return files;
  }

  private parseFileLine(line: string): DeviceFile | null {
    // Parse ls -la output format
    const parts = line.trim().split(/\s+/);
    if (parts.length < 8) return null;

    const permissions = parts[0];
    const size = parseInt(parts[4], 10) || 0;
    const date = parts[5];
    const time = parts[6];
    const name = parts.slice(7).join(' ');

    // Skip current and parent directory entries
    if (name === '.' || name === '..') return null;

    const isDirectory = permissions.startsWith('d');
    const modifiedDate = new Date(`${date} ${time}`);

    return {
      name,
      path: name, // This would need to be constructed with full path in real implementation
      size,
      isDirectory,
      permissions,
      modifiedDate
    };
  }
}