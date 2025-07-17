/**
 * Customer Data Storage
 * 
 * This module handles secure storage and retrieval of customer PII data.
 * In production, this should be replaced with a proper database implementation
 * with encryption, backup, and compliance features.
 */

const { logger } = require('../utils/logger');

class CustomerDataStore {
    constructor() {
        // In-memory storage for demo purposes
        // In production, replace with Redis, MongoDB, PostgreSQL, etc.
        this.data = new Map();
        
        // TTL for automatic cleanup (24 hours)
        this.ttl = 24 * 60 * 60 * 1000;
        
        // Start cleanup interval
        this.startCleanupInterval();
    }
    
    /**
     * Store customer data securely
     * 
     * @param {string} customerId - Unique customer identifier
     * @param {Object} customerData - Customer information
     * @param {string} customerData.firstName - Customer first name
     * @param {string} customerData.lastName - Customer last name
     * @param {string} customerData.phoneNumber - Customer phone number
     * @param {string} customerData.subject - Callback subject
     * @param {string} customerData.desiredTime - Desired callback time
     * @param {string} customerData.createdAt - Creation timestamp
     * @param {string} customerData.requestId - Request tracking ID
     * @returns {Promise<boolean>} Success status
     */
    async store(customerId, customerData) {
        try {
            logger.info('Storing customer data', {
                customerId,
                requestId: customerData.requestId,
                dataKeys: Object.keys(customerData)
            });
            
            // Validate required fields
            // If you want to store firstName, lastName etc...
            // if (!customerData.firstName || !customerData.lastName || !customerData.phoneNumber) {
            //     throw new Error('Missing required customer data fields');
            // }
            
            // Sanitize and validate data
            const sanitizedData = this.sanitizeCustomerData(customerData);
            
            // Add metadata
            const storageData = {
                ...sanitizedData,
                id: customerId,
                storedAt: new Date().toISOString(),
                expiresAt: Date.now() + this.ttl,
                lastAccessed: Date.now()
            };
            
            // Store in memory (replace with database in production)
            this.data.set(customerId, storageData);
            
            logger.info('Customer data stored successfully', {
                customerId,
                requestId: customerData.requestId
            });
            
            return true;
            
        } catch (error) {
            logger.error('Failed to store customer data', {
                customerId,
                requestId: customerData.requestId,
                error: error.message
            });
            
            throw new Error(`Failed to store customer data: ${error.message}`);
        }
    }
    
    /**
     * Retrieve customer data
     * 
     * @param {string} customerId - Customer identifier
     * @returns {Promise<Object|null>} Customer data or null if not found/expired
     */
    async retrieve(customerId) {
        try {
            const data = this.data.get(customerId);
            
            if (!data) {
                logger.debug('Customer data not found', { customerId });
                return null;
            }
            
            // Check if data has expired
            if (Date.now() > data.expiresAt) {
                logger.info('Customer data expired, removing', { customerId });
                this.data.delete(customerId);
                return null;
            }
            
            // Update last accessed time
            data.lastAccessed = Date.now();
            this.data.set(customerId, data);
            
            logger.debug('Customer data retrieved successfully', { 
                customerId,
                storedAt: data.storedAt
            });
            
            return data;
            
        } catch (error) {
            logger.error('Failed to retrieve customer data', {
                customerId,
                error: error.message
            });
            
            throw new Error(`Failed to retrieve customer data: ${error.message}`);
        }
    }
    
    /**
     * Update customer data
     * 
     * @param {string} customerId - Customer identifier
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object|null>} Updated customer data or null if not found
     */
    async update(customerId, updateData) {
        try {
            const existingData = await this.retrieve(customerId);
            
            if (!existingData) {
                logger.warn('Cannot update non-existent customer data', { customerId });
                return null;
            }
            
            // Sanitize update data
            const sanitizedUpdate = this.sanitizeCustomerData(updateData);
            
            // Merge with existing data
            const updatedData = {
                ...existingData,
                ...sanitizedUpdate,
                updatedAt: new Date().toISOString(),
                lastAccessed: Date.now()
            };
            
            // Store updated data
            this.data.set(customerId, updatedData);
            
            logger.info('Customer data updated successfully', {
                customerId,
                updatedFields: Object.keys(sanitizedUpdate)
            });
            
            return updatedData;
            
        } catch (error) {
            logger.error('Failed to update customer data', {
                customerId,
                error: error.message
            });
            
            throw new Error(`Failed to update customer data: ${error.message}`);
        }
    }
    
    /**
     * Delete customer data
     * 
     * @param {string} customerId - Customer identifier
     * @returns {Promise<boolean>} Success status
     */
    async delete(customerId) {
        try {
            const existed = this.data.has(customerId);
            this.data.delete(customerId);
            
            if (existed) {
                logger.info('Customer data deleted successfully', { customerId });
            } else {
                logger.debug('Customer data not found for deletion', { customerId });
            }
            
            return existed;
            
        } catch (error) {
            logger.error('Failed to delete customer data', {
                customerId,
                error: error.message
            });
            
            throw new Error(`Failed to delete customer data: ${error.message}`);
        }
    }
    
    /**
     * Get storage statistics
     * 
     * @returns {Object} Storage statistics
     */
    getStats() {
        const now = Date.now();
        let expired = 0;
        let active = 0;
        
        for (const [id, data] of this.data) {
            if (now > data.expiresAt) {
                expired++;
            } else {
                active++;
            }
        }
        
        return {
            total: this.data.size,
            active,
            expired,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Sanitize customer data to prevent XSS and other attacks
     * 
     * @param {Object} data - Raw customer data
     * @returns {Object} Sanitized data
     */
    sanitizeCustomerData(data) {
        const sanitized = {};
        
        for (const [key, value] of Object.entries(data)) {
            if (value === null || value === undefined) {
                continue;
            }
            
            if (typeof value === 'string') {
                // Remove HTML tags and trim whitespace
                sanitized[key] = value
                    .replace(/<[^>]*>/g, '') // Remove HTML tags
                    .trim()
                    .substring(0, 1000); // Limit length
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }
    
    /**
     * Cleanup expired entries
     */
    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [id, data] of this.data) {
            if (now > data.expiresAt) {
                this.data.delete(id);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            logger.info('Cleaned up expired customer data', {
                cleanedCount,
                remainingCount: this.data.size
            });
        }
        
        return cleanedCount;
    }
    
    /**
     * Start automatic cleanup interval
     */
    startCleanupInterval() {
        // Run cleanup every hour
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60 * 60 * 1000);
        
        logger.info('Customer data cleanup interval started');
    }
    
    /**
     * Stop cleanup interval and close store
     */
    async close() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        
        // Final cleanup
        this.cleanup();
        
        logger.info('Customer data store closed', {
            finalCount: this.data.size
        });
    }
}

module.exports = { 
    CustomerDataStore
};