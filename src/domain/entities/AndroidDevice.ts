
// src/domain/entities/AndroidDevice.ts
export interface AndroidDevice {
  id: string;
  model: string;
  product: string;
  device: string;
  transportId: string;
  status: 'device' | 'unauthorized' | 'offline' | 'no permissions';
  serialNumber: string;
  isAuthorized: boolean;
}