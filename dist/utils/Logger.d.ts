/**
 * Logger class that mimics Mirth Connect's logger
 */
export declare class Logger {
    constructor();
    /**
     * Log an info message
     */
    info(message: any): void;
    /**
     * Log an error message
     */
    error(message: any): void;
    /**
     * Log a warning message
     */
    warn(message: any): void;
    /**
     * Log a debug message
     */
    debug(message: any): void;
    /**
     * Log a trace message
     */
    trace(message: any): void;
    /**
     * Format a message for logging
     */
    private formatMessage;
}
