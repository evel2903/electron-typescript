// src/domain/entities/DeviceFile.ts
export interface DeviceFile {
    name: string;
    path: string;
    size: number;
    isDirectory: boolean;
    permissions: string;
    modifiedDate: Date;
}
