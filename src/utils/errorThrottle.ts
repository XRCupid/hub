// Error throttling utility to prevent console flooding
class ErrorThrottle {
  private errorCounts: Map<string, { count: number; lastLogged: number }> = new Map();
  private readonly throttleWindow = 5000; // 5 seconds
  private readonly maxErrorsPerWindow = 3;

  constructor() {
    // Override console methods to throttle errors
    this.overrideConsoleError();
    this.overrideConsoleWarn();
    this.setupGlobalErrorHandlers();
  }

  private overrideConsoleError() {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const errorKey = this.getErrorKey(args);
      if (this.shouldLog(errorKey)) {
        originalError.apply(console, args);
      }
    };
  }

  private overrideConsoleWarn() {
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      const errorKey = this.getErrorKey(args);
      if (this.shouldLog(errorKey)) {
        originalWarn.apply(console, args);
      }
    };
  }

  private setupGlobalErrorHandlers() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const errorKey = `unhandled-rejection-${event.reason}`;
      if (this.shouldLog(errorKey)) {
        console.error('[Unhandled Rejection]', event.reason);
      }
      event.preventDefault(); // Prevent default error logging
    });

    // Catch global errors
    window.addEventListener('error', (event) => {
      const errorKey = `global-error-${event.message}`;
      if (this.shouldLog(errorKey)) {
        console.error('[Global Error]', event.message);
      }
      event.preventDefault(); // Prevent default error logging
    });
  }

  private getErrorKey(args: any[]): string {
    // Create a unique key based on error content
    return args.map(arg => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg).substring(0, 100);
      }
      return String(arg).substring(0, 100);
    }).join('|');
  }

  private shouldLog(errorKey: string): boolean {
    const now = Date.now();
    const errorInfo = this.errorCounts.get(errorKey);

    if (!errorInfo) {
      // First time seeing this error
      this.errorCounts.set(errorKey, { count: 1, lastLogged: now });
      return true;
    }

    // Check if we're still in the throttle window
    if (now - errorInfo.lastLogged > this.throttleWindow) {
      // Reset the counter for this error
      this.errorCounts.set(errorKey, { count: 1, lastLogged: now });
      return true;
    }

    // We're in the throttle window
    if (errorInfo.count < this.maxErrorsPerWindow) {
      errorInfo.count++;
      return true;
    }

    // Too many errors of this type in the window
    return false;
  }

  // Clean up old entries periodically
  public cleanup() {
    const now = Date.now();
    for (const [key, info] of this.errorCounts.entries()) {
      if (now - info.lastLogged > this.throttleWindow * 2) {
        this.errorCounts.delete(key);
      }
    }
  }
}

// Create and export a singleton instance
export const errorThrottle = new ErrorThrottle();

// Clean up old entries every minute
setInterval(() => errorThrottle.cleanup(), 60000);

// Log that error throttling is active
console.log('[ErrorThrottle] Console error throttling is now active. Repeated errors will be suppressed.');
