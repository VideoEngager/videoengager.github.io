/**
 * Security Middleware Module
 * 
 * This module configures all security-related middleware for the application.
 * It includes CORS, rate limiting, helmet security headers, request logging,
 * and other security measures.
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');

/**
 * Setup all security middleware
 * 
 * @param {Object} app - Express application instance
 */
function setupMiddleware(app) {
    // ============================================
    // SECURITY HEADERS
    // ============================================
    
    // Helmet provides various security headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: [
                    "'self'",
                    `https://${process.env.VE_DOMAIN}`,
                    `https://api.${process.env.GENESYS_ENVIRONMENT}`,
                    `https://login.${process.env.GENESYS_ENVIRONMENT}`
                ],
                fontSrc: ["'self'", "https:", "data:"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"]
            }
        },
        crossOriginEmbedderPolicy: false, // Adjust based on your needs
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true
        }
    }));
    
    // ============================================
    // CORS CONFIGURATION
    // ============================================
    
    const corsOptions = {
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            
            // Define allowed origins
            const allowedOrigins = [
                `http://localhost:${process.env.PORT}`,
                `https://localhost:${process.env.PORT}`,
                process.env.FRONTEND_URL,
                process.env.ALLOWED_ORIGIN
            ].filter(Boolean); // Remove undefined values
            
            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                logger.warn('CORS request blocked', { origin });
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    };
    
    app.use(cors(corsOptions));
    
    // ============================================
    // RATE LIMITING
    // ============================================
    
    // General rate limiting
    const generalLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: {
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: '15 minutes'
        },
        standardHeaders: true, // Return rate limit info in headers
        legacyHeaders: false, // Disable X-RateLimit-* headers
        handler: (req, res) => {
            logger.warn('Rate limit exceeded', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.path
            });
            
            res.status(429).json({
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: '15 minutes'
            });
        }
    });
    
    // Stricter rate limiting for API endpoints
    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 20, // Limit each IP to 20 API requests per windowMs
        message: {
            error: 'Too many API requests from this IP, please try again later.',
            retryAfter: '15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.warn('API rate limit exceeded', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.path
            });
            
            res.status(429).json({
                error: 'Too many API requests from this IP, please try again later.',
                retryAfter: '15 minutes'
            });
        }
    });
    
    // Apply rate limiting
    app.use('/', generalLimiter);
    app.use('/api/', apiLimiter);
    
    // ============================================
    // REQUEST PARSING AND SIZE LIMITS
    // ============================================
    
    // Parse JSON with size limits
    app.use(express.json({ 
        limit: '10mb',
        verify: (req, res, buf) => {
            // Store raw body for webhook signature verification if needed
            req.rawBody = buf;
        }
    }));
    
    // Parse URL-encoded data
    app.use(express.urlencoded({ 
        extended: true, 
        limit: '10mb' 
    }));
    
    // ============================================
    // REQUEST LOGGING AND TRACKING
    // ============================================
    
    // Add request ID for tracking
    app.use((req, res, next) => {
        req.requestId = uuidv4();
        
        // Add request ID to response headers for debugging
        res.setHeader('X-Request-ID', req.requestId);
        
        next();
    });
    
    // Request logging middleware
    app.use((req, res, next) => {
        const startTime = Date.now();
        
        // Log request start
        logger.info('Request started', {
            requestId: req.requestId,
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            contentLength: req.get('Content-Length'),
            referer: req.get('Referer')
        });
        
        // Override res.end to log response
        const originalEnd = res.end;
        res.end = function(chunk, encoding) {
            const duration = Date.now() - startTime;
            
            logger.info('Request completed', {
                requestId: req.requestId,
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration: duration,
                contentLength: res.get('Content-Length')
            });
            
            originalEnd.call(this, chunk, encoding);
        };
        
        next();
    });
    
    // ============================================
    // INPUT SANITIZATION
    // ============================================
    
    // Sanitize request data
    app.use((req, res, next) => {
        if (req.body) {
            req.body = sanitizeObject(req.body);
        }
        
        if (req.query) {
            req.query = sanitizeObject(req.query);
        }
        
        if (req.params) {
            req.params = sanitizeObject(req.params);
        }
        
        next();
    });
    
    // ============================================
    // SECURITY VALIDATION
    // ============================================
    
    // Check for suspicious patterns
    app.use((req, res, next) => {
        const suspiciousPatterns = [
            /(<script|<\/script)/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /eval\s*\(/i,
            /expression\s*\(/i,
            /(union|select|insert|update|delete|drop|create|alter)\s+/i
        ];
        
        // Check URL for suspicious patterns
        if (suspiciousPatterns.some(pattern => pattern.test(req.url))) {
            logger.warn('Suspicious URL detected', {
                requestId: req.requestId,
                url: req.url,
                ip: req.ip
            });
            
            return res.status(400).json({
                error: 'Invalid request',
                requestId: req.requestId
            });
        }
        
        // Check request body for suspicious patterns
        if (req.body) {
            const bodyString = JSON.stringify(req.body);
            if (suspiciousPatterns.some(pattern => pattern.test(bodyString))) {
                logger.warn('Suspicious request body detected', {
                    requestId: req.requestId,
                    ip: req.ip,
                    bodyKeys: Object.keys(req.body)
                });
                
                return res.status(400).json({
                    error: 'Invalid request data',
                    requestId: req.requestId
                });
            }
        }
        
        next();
    });
    
    // ============================================
    // CUSTOM SECURITY HEADERS
    // ============================================
    
    // Add custom security headers
    app.use((req, res, next) => {
        // Prevent clickjacking
        res.setHeader('X-Frame-Options', 'DENY');
        
        // Prevent MIME type sniffing
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        // Enable XSS protection
        res.setHeader('X-XSS-Protection', '1; mode=block');
        
        // Referrer policy
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        // Feature policy
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        
        next();
    });
}

/**
 * Sanitize object recursively to prevent XSS and injection attacks
 * 
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return sanitizeValue(obj);
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        // Sanitize key
        const sanitizedKey = sanitizeValue(key);
        
        // Sanitize value
        sanitized[sanitizedKey] = sanitizeObject(value);
    }
    
    return sanitized;
}

/**
 * Sanitize individual value
 * 
 * @param {*} value - Value to sanitize
 * @returns {*} Sanitized value
 */
function sanitizeValue(value) {
    if (typeof value !== 'string') {
        return value;
    }
    
    // Remove potentially dangerous characters
    return value
        .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
}

/**
 * Webhook signature verification middleware
 * 
 * @param {string} secret - Webhook secret
 * @returns {Function} Middleware function
 */
function verifyWebhookSignature(secret) {
    return (req, res, next) => {
        const signature = req.get('X-Webhook-Signature');
        
        if (!signature) {
            logger.warn('Webhook request missing signature', {
                requestId: req.requestId,
                ip: req.ip
            });
            
            return res.status(401).json({
                error: 'Missing webhook signature',
                requestId: req.requestId
            });
        }
        
        // Verify signature (implement based on your webhook provider)
        const crypto = require('crypto');
        const computedSignature = crypto
            .createHmac('sha256', secret)
            .update(req.rawBody || '')
            .digest('hex');
        
        if (signature !== `sha256=${computedSignature}`) {
            logger.warn('Invalid webhook signature', {
                requestId: req.requestId,
                ip: req.ip,
                providedSignature: signature
            });
            
            return res.status(401).json({
                error: 'Invalid webhook signature',
                requestId: req.requestId
            });
        }
        
        next();
    };
}

/**
 * API key authentication middleware
 * 
 * @param {string} validApiKey - Valid API key
 * @returns {Function} Middleware function
 */
function requireApiKey(validApiKey) {
    return (req, res, next) => {
        const apiKey = req.get('X-API-Key');
        
        if (!apiKey) {
            logger.warn('API request missing API key', {
                requestId: req.requestId,
                ip: req.ip,
                path: req.path
            });
            
            return res.status(401).json({
                error: 'API key required',
                requestId: req.requestId
            });
        }
        
        if (apiKey !== validApiKey) {
            logger.warn('Invalid API key provided', {
                requestId: req.requestId,
                ip: req.ip,
                path: req.path,
                providedKey: apiKey.substring(0, 10) + '...'
            });
            
            return res.status(401).json({
                error: 'Invalid API key',
                requestId: req.requestId
            });
        }
        
        next();
    };
}

module.exports = {
    setupMiddleware,
    verifyWebhookSignature,
    requireApiKey,
    sanitizeObject,
    sanitizeValue
};