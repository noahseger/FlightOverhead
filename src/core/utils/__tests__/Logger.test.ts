import { Logger, LogLevel } from '../Logger';

describe('Logger', () => {
  let logger: Logger;
  let originalConsole: any;

  beforeEach(() => {
    // Save original console methods
    originalConsole = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
    };

    // Mock console methods
    console.debug = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();

    // Reset the logger instance for each test
    // @ts-ignore - accessing private property for testing
    Logger.instance = undefined;
    logger = Logger.getInstance({
      minLevel: LogLevel.DEBUG,
      includeTimestamp: false, // Easier to test without timestamps
      enableConsoleOutput: true,
    });
  });

  afterEach(() => {
    // Restore original console methods
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  it('should create a singleton instance', () => {
    const instance1 = Logger.getInstance();
    const instance2 = Logger.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should log debug messages', () => {
    logger.debug('Test debug message');
    expect(console.debug).toHaveBeenCalledWith('[DEBUG] Test debug message');

    const logs = logger.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0]).toBe('[DEBUG] Test debug message');
  });

  it('should log info messages', () => {
    logger.info('Test info message');
    expect(console.info).toHaveBeenCalledWith('[INFO] Test info message');

    const logs = logger.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0]).toBe('[INFO] Test info message');
  });

  it('should log warning messages', () => {
    logger.warning('Test warning message');
    expect(console.warn).toHaveBeenCalledWith('[WARNING] Test warning message');

    const logs = logger.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0]).toBe('[WARNING] Test warning message');
  });

  it('should log error messages', () => {
    logger.error('Test error message');
    expect(console.error).toHaveBeenCalledWith('[ERROR] Test error message');

    const logs = logger.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0]).toBe('[ERROR] Test error message');
  });

  it('should include context in log messages', () => {
    const context = { userId: '123', action: 'login' };
    logger.info('User action', context);

    expect(console.info).toHaveBeenCalledWith(`[INFO] User action ${JSON.stringify(context)}`);

    const logs = logger.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0]).toBe(`[INFO] User action ${JSON.stringify(context)}`);
  });

  it('should respect minimum log level setting', () => {
    logger.updateConfig({ minLevel: LogLevel.WARNING });

    logger.debug('Debug message'); // Should be ignored
    logger.info('Info message');   // Should be ignored
    logger.warning('Warning message'); // Should be logged
    logger.error('Error message');     // Should be logged

    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith('[WARNING] Warning message');
    expect(console.error).toHaveBeenCalledWith('[ERROR] Error message');

    const logs = logger.getLogs();
    expect(logs.length).toBe(2);
    expect(logs[0]).toBe('[WARNING] Warning message');
    expect(logs[1]).toBe('[ERROR] Error message');
  });

  it('should not output to console when disabled', () => {
    logger.updateConfig({ enableConsoleOutput: false });

    logger.info('Test message');

    expect(console.info).not.toHaveBeenCalled();

    // Messages should still be stored internally
    const logs = logger.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0]).toBe('[INFO] Test message');
  });

  it('should clear logs', () => {
    logger.info('Message 1');
    logger.info('Message 2');

    let logs = logger.getLogs();
    expect(logs.length).toBe(2);

    logger.clearLogs();

    logs = logger.getLogs();
    expect(logs.length).toBe(0);
  });
});
