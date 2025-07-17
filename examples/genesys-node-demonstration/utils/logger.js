/**
 * Logger Utility
 * 
 * This module provides centralized logging functionality for the application.
 * It uses Winston for structured logging with different levels and outputs.
 * 
 * Features:
 * - Structured JSON logging
 * - Multiple log levels (error, warn, info, debug)
 * - File and console outputs
 * - Log rotation
 * - Request tracking
 * - Error stack traces
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom log format for better readability
 */
const customFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let logString = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        // Add metadata if present
        if (Object.keys(meta).length > 0) {
            logString += ` ${JSON.stringify(meta)}`;
        }
        
        return logString;
    })
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
        let logString = `${timestamp} ${level}: ${message}`;
        
        // Add request ID if present
        if (requestId) {
            logString += ` [${requestId}]`;
        }
        
        // Add important metadata
        if (meta.error) {
            logString += ` - Error: ${meta.error}`;
        }
        
        if (meta.customerId) {
            logString += ` - Customer: ${meta.customerId}`;
        }
        
        return logString;
    })
);

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    exitOnError: false,
    defaultMeta: {
        service: 'callback-integration',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        // Error log file - only errors
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 10485760, // 10MB
            maxFiles: 5,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),
        
        // Combined log file - all levels
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 5,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),
        
        // Access log file - for request logging
        new winston.transports.File({
            filename: path.join(logsDir, 'access.log'),
            level: 'info',
            maxsize: 10485760, // 10MB
            maxFiles: 5,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ],
    
    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            maxsize: 10485760,
            maxFiles: 3
        })
    ],
    
    // Handle unhandled promise rejections
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            maxsize: 10485760,
            maxFiles: 3
        })
    ]
});

/**
 * Add console transport for development
 */
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }));
}

/**
 * Add console transport for production (errors only)
 */
if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        level: 'error'
    }));
}

/**
 * Enhanced logging methods with context
 */
const enhancedLogger = {
    
    /**
     * Log error with enhanced context
     * 
     * @param {string} message - Error message
     * @param {Object} meta - Additional metadata
     * @param {Error} error - Error object (optional)
     */
    error: (message, meta = {}, error = null) => {
        const logData = {
            ...meta,
            timestamp: new Date().toISOString()
        };
        
        if (error) {
            logData.error = error.message;
            logData.stack = error.stack;
        }
        
        logger.error(message, logData);
    },
    
    /**
     * Log warning with context
     * 
     * @param {string} message - Warning message
     * @param {Object} meta - Additional metadata
     */
    warn: (message, meta = {}) => {
        logger.warn(message, {
            ...meta,
            timestamp: new Date().toISOString()
        });
    },
    
    /**
     * Log info with context
     * 
     * @param {string} message - Info message
     * @param {Object} meta - Additional metadata
     */
    info: (message, meta = {}) => {
        logger.info(message, {
            ...meta,
            timestamp: new Date().toISOString()
        });
    },
    
    /**
     * Log debug with context
     * 
     * @param {string} message - Debug message
     * @param {Object} meta - Additional metadata
     */
    debug: (message, meta = {}) => {
        logger.debug(message, {
            ...meta,
            timestamp: new Date().toISOString()
        });
    },
    
    /**
     * Log API request
     * 
     * @param {string} method - HTTP method
     * @param {string} url - Request URL
     * @param {Object} meta - Additional metadata
     */
    apiRequest: (method, url, meta = {}) => {
        logger.info('API Request', {
            type: 'api_request',
            method,
            url,
            ...meta,
            timestamp: new Date().toISOString()
        });
    },
    
    /**
     * Log API response
     * 
     * @param {string} method - HTTP method
     * @param {string} url - Request URL
     * @param {number} statusCode - Response status code
     * @param {number} duration - Request duration in ms
     * @param {Object} meta - Additional metadata
     */
    apiResponse: (method, url, statusCode, duration, meta = {}) => {
        logger.info('API Response', {
            type: 'api_response',
            method,
            url,
            statusCode,
            duration,
            ...meta,
            timestamp: new Date().toISOString()
        });
    },
    
    /**
     * Log security event
     * 
     * @param {string} event - Security event type
     * @param {Object} meta - Additional metadata
     */
    security: (event, meta = {}) => {
        logger.warn('Security Event', {
            type: 'security',
            event,
            ...meta,
            timestamp: new Date().toISOString()
        });
    },
    
    /**
     * Log business event
     * 
     * @param {string} event - Business event type
     * @param {Object} meta - Additional metadata
     */
    business: (event, meta = {}) => {
        logger.info('Business Event', {
            type: 'business',
            event,
            ...meta,
            timestamp: new Date().toISOString()
        });
    },
    
    /**
     * Log performance metric
     * 
     * @param {string} metric - Metric name
     * @param {number} value - Metric value
     * @param {Object} meta - Additional metadata
     */
    performance: (metric, value, meta = {}) => {
        logger.info('Performance Metric', {
            type: 'performance',
            metric,
            value,
            ...meta,
            timestamp: new Date().toISOString()
        });
    },
    
    /**
     * Get current log level
     * 
     * @returns {string} Current log level
     */
    getLevel: () => {
        return logger.level;
    },
    
    /**
     * Set log level
     * 
     * @param {string} level - Log level to set
     */
    setLevel: (level) => {
        logger.level = level;
    }
};

/**
 * Log application startup
 */
enhancedLogger.info('Logger initialized', {
    level: logger.level,
    environment: process.env.NODE_ENV || 'development',
    logsDirectory: logsDir
});

/**
 * Graceful shutdown handler
 */
process.on('SIGTERM', () => {
    enhancedLogger.info('Received SIGTERM, shutting down gracefully');
    logger.end();
});

process.on('SIGINT', () => {
    enhancedLogger.info('Received SIGINT, shutting down gracefully');
    logger.end();
});

/**
 * Export logger instance and enhanced methods
 */
module.exports = {
    logger: enhancedLogger,
    winston: logger, // Export raw winston instance if needed
    
    /**
     * Create child logger with additional context
     * 
     * @param {Object} defaultMeta - Default metadata for all logs
     * @returns {Object} Child logger instance
     */
    createChildLogger: (defaultMeta = {}) => {
        const childLogger = winston.createLogger({
            level: logger.level,
            format: logger.format,
            defaultMeta: {
                ...logger.defaultMeta,
                ...defaultMeta
            },
            transports: logger.transports
        });
        
        return {
            error: (message, meta = {}) => enhancedLogger.error(message, { ...defaultMeta, ...meta }),
            warn: (message, meta = {}) => enhancedLogger.warn(message, { ...defaultMeta, ...meta }),
            info: (message, meta = {}) => enhancedLogger.info(message, { ...defaultMeta, ...meta }),
            debug: (message, meta = {}) => enhancedLogger.debug(message, { ...defaultMeta, ...meta })
        };
    }
};