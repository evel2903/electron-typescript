// src/shared/constants/app.ts
export const APP_CONSTANTS = {
    NAME: 'Clean Architecture Electron App',
    VERSION: '1.0.0',
    DESCRIPTION: 'A demonstration of Clean Architecture principles in an Electron application',
} as const;

export const ENVIRONMENT = {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
} as const;
