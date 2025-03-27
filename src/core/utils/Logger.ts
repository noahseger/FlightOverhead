/**
 * Log levels for the application
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
}

/**
 * Configuration for Logger
 */
export interface LoggerConfig {
  minLevel: LogLevel;
  includeTimestamp: boolean;
  enableConsoleOutput: boolean;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: LogLevel.DEBUG,
  includeTimestamp: true,
  enableConsoleOutput: true,
};

/**
 * Logger service provides logging functionality with different levels
 */
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logs: string[] = [];

  private constructor(config: LoggerConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Get singleton instance of Logger
   */
  public static getInstance(config?: LoggerConfig): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  /**
   * Update logger configuration
   * @param config New configuration
   */
  public updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Log a message at DEBUG level
   * @param message Message to log
   * @param context Optional context information
   */
  public debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log a message at INFO level
   * @param message Message to log
   * @param context Optional context information
   */
  public info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a message at WARNING level
   * @param message Message to log
   * @param context Optional context information
   */
  public warning(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARNING, message, context);
  }

  /**
   * Log a message at ERROR level
   * @param message Message to log
   * @param context Optional context information
   */
  public error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Get all logs
   * @returns Array of log messages
   */
  public getLogs(): string[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Internal method to log a message
   * @param level Log level
   * @param message Message to log
   * @param context Optional context information
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (level < this.config.minLevel) {
      return;
    }

    const timestamp = this.config.includeTimestamp ? new Date().toISOString() : '';
    const levelStr = LogLevel[level];
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';

    const logMessage = this.config.includeTimestamp
      ? `[${timestamp}] [${levelStr}] ${message}${contextStr}`
      : `[${levelStr}] ${message}${contextStr}`;

    this.logs.push(logMessage);

    if (this.config.enableConsoleOutput) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(logMessage);
          break;
        case LogLevel.INFO:
          console.info(logMessage);
          break;
        case LogLevel.WARNING:
          console.warn(logMessage);
          break;
        case LogLevel.ERROR:
          console.error(logMessage);
          break;
      }
    }
  }
}
