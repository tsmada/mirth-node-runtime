/**
 * Logger class that mimics Mirth Connect's logger
 */
export class Logger {
  constructor() {}

  /**
   * Log an info message
   */
  info(message: any): void {
    console.log(`[INFO] ${this.formatMessage(message)}`);
  }

  /**
   * Log an error message
   */
  error(message: any): void {
    console.error(`[ERROR] ${this.formatMessage(message)}`);
  }

  /**
   * Log a warning message
   */
  warn(message: any): void {
    console.warn(`[WARN] ${this.formatMessage(message)}`);
  }

  /**
   * Log a debug message
   */
  debug(message: any): void {
    console.debug(`[DEBUG] ${this.formatMessage(message)}`);
  }

  /**
   * Log a trace message
   */
  trace(message: any): void {
    console.debug(`[TRACE] ${this.formatMessage(message)}`);
  }

  /**
   * Format a message for logging
   */
  private formatMessage(message: any): string {
    if (message === null || message === undefined) {
      return 'null';
    }
    
    if (typeof message === 'object') {
      try {
        return JSON.stringify(message);
      } catch (e) {
        return message.toString();
      }
    }
    
    return message.toString();
  }
} 