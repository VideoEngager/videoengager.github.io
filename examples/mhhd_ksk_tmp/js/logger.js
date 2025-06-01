// File: src/core/logger.js (or a suitable path)

/**
 * Log levels enum (using constants for JS compatibility)
 * Lower number = higher priority (more likely to be logged)
 */
export const LogLevel = Object.freeze({
    NONE: 0, // Higher than any level, effectively disables
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4,
  });
  
  /**
   * Logger interface that consumers can implement.
   * Uses JSDoc for type definition in JavaScript.
   * Class-based approach allows for instanceof checks if needed.
   * @interface
   */
  export class ILogger {
    /**
     * Logs a debug message.
     * @param {string} message - The primary log message.
     * @param {object} [context] - Additional key-value context.
     */
    debug(message, context) {
      // Base implementation could warn or be a no-op
      console.warn('ILogger.debug not implemented', message, context);
    }
  
    /**
     * Logs an informational message.
     * @param {string} message - The primary log message.
     * @param {object} [context] - Additional key-value context.
     */
    info(message, context) {
       console.warn('ILogger.info not implemented', message, context);
    }
  
    /**
     * Logs a warning message.
     * @param {string} message - The primary log message.
     * @param {object} [context] - Additional key-value context.
     */
    warn(message, context) {
       console.warn('ILogger.warn not implemented', message, context);
    }
  
    /**
     * Logs an error message.
     * @param {string} message - The primary log message.
     * @param {Error|object} [error] - The associated error object or error context.
     * @param {object} [context] - Additional key-value context.
     */
    error(message, error, context) {
       console.warn('ILogger.error not implemented', message, error, context);
    }
  
    /**
     * Creates a child logger instance with additional context merged in.
     * Useful for adding component-specific context automatically.
     * @param {object} context - Context to add to the child logger.
     * @returns {ILogger} - A new logger instance with the merged context.
     */
    withContext(context) {
       console.warn('ILogger.withContext not implemented', context);
       // Return self as a fallback, although implementations should override
       return this;
    }
  
    /**
     * Sets the minimum log level for this logger instance.
     * @param {LogLevel} level
     */
    setLevel(level) {
       console.warn('ILogger.setLevel base implementation called - might not be effective unless overridden.', level);
    }
  
     /**
     * Gets the current log level for this logger instance.
     * @returns {LogLevel}
     */
    getLevel() {
        console.warn('ILogger.getLevel base implementation called - returning default INFO.');
        return LogLevel.INFO;
    }
  }
  
  // --- Default Console Logger Implementation ---
  
  export class ConsoleLogger extends ILogger {
    /**
     * @param {object} [options={}]
     * @param {LogLevel} [options.level=LogLevel.INFO] - Initial log level.
     * @param {string} [options.component] - Optional component name to add to context.
     * @param {object} [options.context={}] - Optional base context.
     */
    constructor(options = {}) {
      super();
      // Ensure level is a valid LogLevel value, default to INFO
      this._level = Object.values(LogLevel).includes(options.level) ? options.level : LogLevel.INFO;
      this._component = options.component;
      this._baseContext = options.context || {};
      // console.log(`[ConsoleLogger] Initialized. Level: ${this._level}, Component: ${this._component}`);
    }
  
    setLevel(level) {
      if (Object.values(LogLevel).includes(level)) {
          // console.log(`[ConsoleLogger] Setting level: ${level}`);
          this._level = level;
      } else {
          console.warn(`[ConsoleLogger] Attempted to set invalid log level: ${level}. Level remains ${this._level}.`);
      }
    }
  
    getLevel() {
        return this._level;
    }
  
    debug(message, context = {}) {
      // *** CORRECTED LEVEL CHECK ***
      // Log if the configured level includes DEBUG (i.e., configured level is DEBUG or lower number/higher priority)
      // ERROR:1, WARN:2, INFO:3, DEBUG:4, NONE:5
      // We want to log if message level (DEBUG=4) is included by the configured level.
      // This means configured level must be >= DEBUG (4).
      // Example: If _level=INFO(3), 3 < 4, don't log. If _level=DEBUG(4), 4 >= 4, log.
      if (this._level >= LogLevel.DEBUG) {
        console.debug(this._formatMessage(LogLevel.DEBUG, message, context));
      }
    }
  
    info(message, context = {}) {
      // *** CORRECTED LEVEL CHECK ***
      // Log if configured level is INFO(3) or lower (meaning INFO, WARN, ERROR are enabled)
      // Check: Is configured level >= INFO? (e.g., INFO=3, DEBUG=4)
       if (this._level >= LogLevel.INFO) {
        console.info(this._formatMessage(LogLevel.INFO, message, context));
      }
    }
  
    warn(message, context = {}) {
      // *** CORRECTED LEVEL CHECK ***
      // Log if configured level is WARN(2) or lower (meaning WARN, ERROR are enabled)
      // Check: Is configured level >= WARN? (e.g., WARN=2, INFO=3, DEBUG=4)
      if (this._level >= LogLevel.WARN) {
        console.warn(this._formatMessage(LogLevel.WARN, message, context));
      }
    }
  
    error(message, error, context = {}) {
      // *** CORRECTED LEVEL CHECK ***
      // Log if configured level is ERROR(1) or lower (meaning only ERROR is enabled)
      // Check: Is configured level >= ERROR? (e.g., ERROR=1, WARN=2, INFO=3, DEBUG=4)
      if (this._level >= LogLevel.ERROR) {
        console.error(this._formatMessage(LogLevel.ERROR, message, context, error), error instanceof Error ? error : '');
      }
    }
  
    withContext(context) {
      // Create a new logger instance inheriting level but merging context
      return new ConsoleLogger({
        level: this._level,
        component: this._component, // Component name is inherited
        // Shallow merge: New context overrides base context keys
        context: { ...this._baseContext, ...context }
      });
    }
  
    /** Formats the log entry as a JSON string for structured logging */
    _formatMessage(level, message, context, error) {
      const entry = {
        timestamp: new Date().toISOString(),
        level: Object.keys(LogLevel).find(key => LogLevel[key] === level)?.toLowerCase() || 'unknown', // Get level name
        component: this._component, // Add component if set
        message,
        ...this._baseContext, // Add base context
        ...context // Add call-specific context
      };
  
      // Remove undefined component field for cleaner output
      if (entry.component === undefined) {
          delete entry.component;
      }
  
      // Standardize error formatting within the logged context
      if (error) {
        entry.error = {
          message: error.message,
          name: error.name,
          stack: error.stack,
          // Add other non-standard properties if error is not an Error instance
          ...(error instanceof Error ? {} : error)
        };
      }
  
      // Use JSON.stringify for structured output
      // Handle potential circular references and Error serialization gracefully
      try {
          // Custom replacer to handle Error objects correctly within JSON
          const replacer = (key, value) => {
               if (value instanceof Error) {
                   // Extract relevant properties from Error object
                   const errorObject = { message: value.message, name: value.name };
                   // Include stack only for debug level or if explicitly requested? For now, always include.
                   if (value.stack) {
                       errorObject.stack = value.stack.split('\n').map(line => line.trim()); // Clean up stack
                   }
                   // Include other potential custom error properties
                   Object.keys(value).forEach(errKey => {
                       if (errKey !== 'message' && errKey !== 'name' && errKey !== 'stack') {
                           errorObject[errKey] = value[errKey];
                       }
                   });
                   return errorObject;
               }
               // Prevent logging excessively large objects or circular structures
               if (typeof value === 'object' && value !== null) {
                   // Basic check for depth or size could be added here if needed
               }
               return value;
          };
          return JSON.stringify(entry, replacer);
      } catch (e) {
           // Fallback if stringify fails (e.g., circular refs)
           console.error("[ConsoleLogger] Failed to stringify log entry:", e);
           // Attempt to create a safe, minimal representation
           return JSON.stringify({
               timestamp: entry.timestamp,
               level: entry.level,
               component: entry.component,
               message: message + " (Log entry stringify failed - details omitted)",
               stringifyError: e.message
           });
      }
    }
  }
  
  // --- Logger Factory ---
  
  /**
   * Creates or returns a logger instance.
   * If a valid logger instance (duck-typed) is passed, it's returned directly.
   * Otherwise, creates a default ConsoleLogger, configuring its level based on options.debug or options.level.
   *
   * @param {ILogger|object|boolean} [loggerOrConfig] - Either an ILogger instance, a config object ({ logger?, debug?, component?, context?, level? }), or just the debug flag.
   * @param {object} [defaultOptions={}] - Default options (like component name) if creating a ConsoleLogger.
   * @returns {ILogger} A logger instance conforming to ILogger.
   */
  export function createLogger(loggerOrConfig, defaultOptions = {}) {
    // 1. Check if a valid logger instance was passed directly (use duck typing)
    if (loggerOrConfig && typeof loggerOrConfig.info === 'function' && typeof loggerOrConfig.error === 'function') {
      // console.log("[createLogger] Using provided compatible logger instance.");
      return loggerOrConfig;
    }
  
    // 2. Determine options for creating a default ConsoleLogger
    let options = { ...defaultOptions }; // Start with defaults passed by the caller
    let explicitDebugFlag = undefined;
    let explicitLevel = undefined;
  
    if (typeof loggerOrConfig === 'object' && loggerOrConfig !== null) {
      // It's a configuration object
      options = { ...options, ...loggerOrConfig }; // Merge caller defaults and config object
      explicitDebugFlag = options.debug; // Get debug flag from config object
      explicitLevel = options.level; // Get explicit level from config object
  
       // If a logger was *inside* the config object, use that (check via duck typing again)
       if (options.logger && typeof options.logger.info === 'function' && typeof options.logger.error === 'function') {
          // console.log("[createLogger] Using logger instance provided within config object.");
          return options.logger;
       }
    } else if (typeof loggerOrConfig === 'boolean') {
      // Only the debug flag was passed
      explicitDebugFlag = loggerOrConfig;
    }
  
    // 3. Create the default ConsoleLogger
    // console.log("[createLogger] Creating default ConsoleLogger.");
    // Pass component/context defaults from defaultOptions merged with loggerOrConfig options
    // Explicit level from config takes precedence if provided
    if (explicitLevel !== undefined && Object.values(LogLevel).includes(explicitLevel)) {
        options.level = explicitLevel;
    }
    const newLogger = new ConsoleLogger(options); // Pass merged options including potential level
  
    // 4. Set level based ONLY on debug flag IF no explicit level was provided via options.level
    if (explicitLevel === undefined && typeof explicitDebugFlag === 'boolean') {
        const level = explicitDebugFlag ? LogLevel.DEBUG : LogLevel.INFO;
        // console.log(`[createLogger] Setting default logger level based on debug flag (${explicitDebugFlag}): ${level}`);
        newLogger.setLevel(level);
    } else if (explicitLevel === undefined) {
         // console.log(`[createLogger] No debug flag or explicit level provided, default logger level remains: ${newLogger.getLevel()}`);
    } // If explicitLevel was set, it was handled during ConsoleLogger construction or setLevel above
  
    return newLogger;
  }
  