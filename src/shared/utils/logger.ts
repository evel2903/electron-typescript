// src/shared/utils/logger.ts
export class Logger {
    private static instance: Logger;

    private constructor() {}

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    info(message: string, ...args: any[]): void {
        console.log(`[INFO] ${message}`, ...args);
    }

    warn(message: string, ...args: any[]): void {
        console.warn(`[WARN] ${message}`, ...args);
    }

    error(message: string, error?: Error, ...args: any[]): void {
        console.error(`[ERROR] ${message}`, error, ...args);
    }

    debug(message: string, ...args: any[]): void {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }
}
