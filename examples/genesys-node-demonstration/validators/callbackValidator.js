/**
 * Request Validation Module
 * 
 * This module provides comprehensive validation for incoming requests.
 * It ensures data integrity, security, and proper formatting before
 * processing customer callback requests.
 */

const { logger } = require('../utils/logger');

/**
 * Validate callback request data
 * 
 * @param {Object} requestData - Raw request data from client
 * @returns {Object} Validation result with sanitized data or errors
 */
function validateCallbackRequest(requestData) {
    const errors = [];
    const sanitizedData = {};
    
    try {
        // ============================================
        // REQUIRED FIELDS VALIDATION
        // ============================================
        
        // First Name validation
        // Example of how you would validate the firstName if required
        // if (!requestData.firstName || typeof requestData.firstName !== 'string') {
        //     errors.push('First name is required and must be a string');
        // } else {
        //     const firstName = sanitizeString(requestData.firstName);
        //     if (firstName.length < 1 || firstName.length > 50) {
        //         errors.push('First name must be between 1 and 50 characters');
        //     } else if (!isValidName(firstName)) {
        //         errors.push('First name contains invalid characters');
        //     } else {
        //         sanitizedData.firstName = firstName;
        //     }
        // }
        
        // Last Name validation
        // Example of how you would validate the lastName if required
        // if (!requestData.lastName || typeof requestData.lastName !== 'string') {
        //     errors.push('Last name is required and must be a string');
        // } else {
        //     const lastName = sanitizeString(requestData.lastName);
        //     if (lastName.length < 1 || lastName.length > 50) {
        //         errors.push('Last name must be between 1 and 50 characters');
        //     } else if (!isValidName(lastName)) {
        //         errors.push('Last name contains invalid characters');
        //     } else {
        //         sanitizedData.lastName = lastName;
        //     }
        // }
        
        // Phone Number validation
        if (!requestData.phoneNumber || typeof requestData.phoneNumber !== 'string') {
            errors.push('Phone number is required and must be a string');
        } else {
            const phoneNumber = sanitizePhoneNumber(requestData.phoneNumber);
            if (!isValidPhoneNumber(phoneNumber)) {
                errors.push('Phone number format is invalid');
            } else {
                sanitizedData.phoneNumber = phoneNumber;
            }
        }
        
        // ============================================
        // OPTIONAL FIELDS VALIDATION
        // ============================================
        
        // Subject validation (optional)
        if (requestData.subject !== undefined) {
            if (typeof requestData.subject !== 'string') {
                errors.push('Subject must be a string');
            } else {
                const subject = sanitizeString(requestData.subject);
                if (subject.length > 200) {
                    errors.push('Subject must be 200 characters or less');
                } else {
                    sanitizedData.subject = subject;
                }
            }
        }
        
        // Desired Time validation (optional)
        if (requestData.desiredTime !== undefined) {
            if (typeof requestData.desiredTime !== 'string') {
                errors.push('Desired time must be a string');
            } else {
                const desiredTime = validateDateTime(requestData.desiredTime);
                if (!desiredTime.isValid) {
                    errors.push(`Desired time is invalid: ${desiredTime.error}`);
                } else {
                    sanitizedData.desiredTime = desiredTime.value;
                }
            }
        } else {
            // Default to 1 hour from now
            sanitizedData.desiredTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        }
        
        // ============================================
        // SECURITY VALIDATION
        // ============================================
        
        // Check for suspicious patterns
        const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /eval\s*\(/i,
            /expression\s*\(/i
        ];
        
        const allValues = Object.values(requestData).join(' ');
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(allValues)) {
                errors.push('Request contains potentially malicious content');
                break;
            }
        }
        
        // ============================================
        // RETURN VALIDATION RESULT
        // ============================================
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            data: sanitizedData
        };
        
    } catch (error) {
        logger.error('Error during request validation', {
            error: error.message,
            requestData: Object.keys(requestData)
        });
        
        return {
            isValid: false,
            errors: ['Internal validation error'],
            data: {}
        };
    }
}

/**
 * Sanitize string input by removing HTML tags and excess whitespace
 * 
 * @param {string} input - Raw string input
 * @returns {string} Sanitized string
 */
function sanitizeString(input) {
    if (typeof input !== 'string') {
        return '';
    }
    
    return input
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&[^;]+;/g, '') // Remove HTML entities
        .trim() // Remove leading/trailing whitespace
        .replace(/\s+/g, ' '); // Normalize internal whitespace
}

/**
 * Sanitize phone number by removing non-numeric characters except +
 * 
 * @param {string} phoneNumber - Raw phone number
 * @returns {string} Sanitized phone number
 */
function sanitizePhoneNumber(phoneNumber) {
    if (typeof phoneNumber !== 'string') {
        return '';
    }
    
    // Remove all characters except digits, +, -, (, ), and spaces
    return phoneNumber.replace(/[^\d\+\-\(\)\s]/g, '');
}

/**
 * Validate name format (letters, spaces, hyphens, apostrophes)
 * 
 * @param {string} name - Name to validate
 * @returns {boolean} True if valid
 */
function isValidName(name) {
    // Allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    return nameRegex.test(name);
}

/**
 * Validate phone number format
 * 
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} True if valid
 */
function isValidPhoneNumber(phoneNumber) {
    // Remove all non-numeric characters except +
    const cleaned = phoneNumber.replace(/[^\d\+]/g, '');
    
    // Basic validation patterns
    const patterns = [
        /^\+\d{10,15}$/, // International format: +1234567890
        /^\d{10}$/, // US format: 1234567890
        /^1\d{10}$/, // US format with country code: 11234567890
        /^\+1\d{10}$/ // US international format: +11234567890
    ];
    
    return patterns.some(pattern => pattern.test(cleaned));
}

/**
 * Validate and normalize datetime string
 * 
 * @param {string} dateTimeString - DateTime string to validate
 * @returns {Object} Validation result with normalized value
 */
function validateDateTime(dateTimeString) {
    try {
        const date = new Date(dateTimeString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return {
                isValid: false,
                error: 'Invalid date format'
            };
        }
        
        // Check if date is in the past
        const now = new Date();
        if (date <= now) {
            return {
                isValid: false,
                error: 'Desired time must be in the future'
            };
        }
        
        // Check if date is too far in the future (e.g., more than 1 year)
        const maxFutureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        if (date > maxFutureDate) {
            return {
                isValid: false,
                error: 'Desired time cannot be more than 1 year in the future'
            };
        }
        
        // Check if date is within business hours (optional)
        const businessHours = validateBusinessHours(date);
        if (!businessHours.isValid) {
            logger.warn('Callback requested outside business hours', {
                requestedTime: date.toISOString(),
                warning: businessHours.warning
            });
            // Don't reject, just log warning
        }
        
        return {
            isValid: true,
            value: date.toISOString()
        };
        
    } catch (error) {
        return {
            isValid: false,
            error: 'Unable to parse date'
        };
    }
}

/**
 * Validate if requested time is within business hours
 * 
 * @param {Date} date - Date to validate
 * @returns {Object} Validation result with warning if needed
 */
function validateBusinessHours(date) {
    // Configure business hours (adjust as needed)
    const businessHours = {
        start: 9, // 9 AM
        end: 17, // 5 PM
        days: [1, 2, 3, 4, 5], // Monday-Friday (0=Sunday, 6=Saturday)
        timezone: 'UTC' // Configure based on your business timezone
    };
    
    const hour = date.getHours();
    const day = date.getDay();
    
    // Check if it's a business day
    if (!businessHours.days.includes(day)) {
        return {
            isValid: false,
            warning: 'Requested time is outside business days'
        };
    }
    
    // Check if it's within business hours
    if (hour < businessHours.start || hour >= businessHours.end) {
        return {
            isValid: false,
            warning: 'Requested time is outside business hours'
        };
    }
    
    return {
        isValid: true
    };
}

/**
 * Validate environment configuration
 * 
 * @returns {Object} Validation result
 */
function validateEnvironmentConfig() {
    const requiredVars = [
        'VE_PAK',
        'VE_EXTERNAL_ID',
        'VE_EMAIL',
        'GENESYS_ENVIRONMENT',
        'GENESYS_QUEUE_ID',
        'GENESYS_SCRIPT_ID',
        'GENESYS_CLIENT_ID',
        'GENESYS_CLIENT_SECRET'
    ];
    
    const missing = [];
    const invalid = [];
    
    for (const varName of requiredVars) {
        const value = process.env[varName];
        
        if (!value) {
            missing.push(varName);
            continue;
        }
        
        // Basic format validation
        if (varName === 'VE_EMAIL' && !isValidEmail(value)) {
            invalid.push(`${varName}: Invalid email format`);
        }
        
        if (varName === 'GENESYS_ENVIRONMENT' && !isValidDomain(value)) {
            invalid.push(`${varName}: Invalid domain format`);
        }
        
        if (varName.includes('_ID') && value.length < 10) {
            invalid.push(`${varName}: ID appears too short`);
        }
    }
    
    return {
        isValid: missing.length === 0 && invalid.length === 0,
        missing,
        invalid
    };
}

/**
 * Validate email format
 * 
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate domain format
 * 
 * @param {string} domain - Domain to validate
 * @returns {boolean} True if valid
 */
function isValidDomain(domain) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain);
}

/**
 * Validate callback update request
 * 
 * @param {Object} updateData - Update data
 * @returns {Object} Validation result
 */
function validateCallbackUpdate(updateData) {
    const errors = [];
    const sanitizedData = {};
    
    // Only allow specific fields to be updated
    const allowedFields = ['subject', 'desiredTime', 'status'];
    
    for (const [key, value] of Object.entries(updateData)) {
        if (!allowedFields.includes(key)) {
            errors.push(`Field '${key}' is not allowed to be updated`);
            continue;
        }
        
        switch (key) {
            case 'subject':
                if (typeof value !== 'string') {
                    errors.push('Subject must be a string');
                } else {
                    const subject = sanitizeString(value);
                    if (subject.length > 200) {
                        errors.push('Subject must be 200 characters or less');
                    } else {
                        sanitizedData.subject = subject;
                    }
                }
                break;
                
            case 'desiredTime':
                const timeValidation = validateDateTime(value);
                if (!timeValidation.isValid) {
                    errors.push(`Desired time is invalid: ${timeValidation.error}`);
                } else {
                    sanitizedData.desiredTime = timeValidation.value;
                }
                break;
                
            case 'status':
                const validStatuses = ['pending', 'scheduled', 'completed', 'cancelled'];
                if (!validStatuses.includes(value)) {
                    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
                } else {
                    sanitizedData.status = value;
                }
                break;
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        data: sanitizedData
    };
}

/**
 * Validate customer ID format
 * 
 * @param {string} customerId - Customer ID to validate
 * @returns {boolean} True if valid
 */
function isValidCustomerId(customerId) {
    // Customer IDs should follow a specific pattern
    const customerIdRegex = /^cust_[a-zA-Z0-9]{10,}$/;
    return typeof customerId === 'string' && customerIdRegex.test(customerId);
}

/**
 * Rate limiting validation
 * 
 * @param {string} clientIP - Client IP address
 * @param {Object} rateLimitStore - Rate limit storage
 * @returns {Object} Rate limit result
 */
function validateRateLimit(clientIP, rateLimitStore) {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 10; // Maximum requests per window
    
    // Get current request count for this IP
    const clientData = rateLimitStore.get(clientIP) || {
        requests: 0,
        windowStart: now
    };
    
    // Check if we're in a new window
    if (now - clientData.windowStart > windowMs) {
        clientData.requests = 0;
        clientData.windowStart = now;
    }
    
    // Check if limit exceeded
    if (clientData.requests >= maxRequests) {
        return {
            allowed: false,
            resetTime: clientData.windowStart + windowMs,
            remaining: 0
        };
    }
    
    // Increment counter
    clientData.requests++;
    rateLimitStore.set(clientIP, clientData);
    
    return {
        allowed: true,
        remaining: maxRequests - clientData.requests,
        resetTime: clientData.windowStart + windowMs
    };
}

/**
 * Validate webhook payload (for Genesys webhooks)
 * 
 * @param {Object} payload - Webhook payload
 * @returns {Object} Validation result
 */
function validateWebhookPayload(payload) {
    const errors = [];
    
    // Check required webhook fields
    if (!payload.eventType) {
        errors.push('eventType is required');
    }
    
    if (!payload.conversationId) {
        errors.push('conversationId is required');
    }
    
    if (!payload.timestamp) {
        errors.push('timestamp is required');
    } else {
        const timestamp = new Date(payload.timestamp);
        if (isNaN(timestamp.getTime())) {
            errors.push('Invalid timestamp format');
        }
    }
    
    // Validate event type
    const validEventTypes = [
        'callback.scheduled',
        'callback.started',
        'callback.completed',
        'callback.cancelled'
    ];
    
    if (payload.eventType && !validEventTypes.includes(payload.eventType)) {
        errors.push(`Invalid eventType. Must be one of: ${validEventTypes.join(', ')}`);
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Sanitize and validate file upload (if supporting file uploads)
 * 
 * @param {Object} file - Uploaded file object
 * @returns {Object} Validation result
 */
function validateFileUpload(file) {
    const errors = [];
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        errors.push('File size must be less than 5MB');
    }
    
    // Check file type
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'text/plain'
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
        errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    // Check filename for security
    const filename = file.originalname || '';
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        errors.push('Invalid filename');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    validateCallbackRequest,
    validateCallbackUpdate,
    validateEnvironmentConfig,
    validateRateLimit,
    validateWebhookPayload,
    validateFileUpload,
    isValidCustomerId,
    isValidEmail,
    isValidDomain,
    isValidName,
    isValidPhoneNumber,
    sanitizeString,
    sanitizePhoneNumber
};