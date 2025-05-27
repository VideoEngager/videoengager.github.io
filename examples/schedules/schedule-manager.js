class ScheduleManager {
    constructor() {
        this.baseUrl = null;
        this.tenantId = null;
        this.isConfigured = false;
    }

    /**
     * Book a callback appointment
     * @param {Object} bookingData - Booking information
     * @param {string} bookingData.firstname - Customer's first name
     * @param {string} bookingData.lastname - Customer's last name
     * @param {string} bookingData.phonenumber - Customer's phone number
     * @param {string} bookingData.email - Customer's email address
     * @param {string} bookingData.desiredTime - Desired appointment time (ISO string)
     * @returns {Promise<Object>} Booking response
     */
    async bookCallback(bookingData) {
        if (!this.isConfigured) {
            throw new Error('ScheduleManager not configured. Call configure() first.');
        }

        // Build the API URL for callback booking
        const pathname = `api/genesys/callback/${this.tenantId}`;
        const fullUrl = `${this.baseUrl}/${pathname}`;
        
        // Prepare the request body with the exact field names required
        const requestBody = {
            firstname: bookingData.firstname,
            lastname: bookingData.lastname,
            customer_number: bookingData.phonenumber, // Note: API expects customer_number
            customer_email: bookingData.email,
            tennantId: this.tenantId, // Note: API uses 'tennantId' (with double 'n')
            _desired_time: bookingData.desiredTime
        };
        
        console.log('Making callback booking request:', {
            url: fullUrl,
            method: 'POST',
            body: requestBody
        });

        try {
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const responseText = await response.text();
            let responseData;
            
            try {
                responseData = JSON.parse(responseText);
            } catch (parseError) {
                // If response is not JSON, use the text as is
                responseData = { message: responseText };
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            
            console.log('Callback booking response received:', responseData);
            return {
                success: true,
                data: responseData,
                url: fullUrl,
                status: response.status,
                requestBody: requestBody
            };

        } catch (error) {
            console.error('Error booking callback:', error);
            
            return {
                success: false,
                error: error.message,
                url: fullUrl,
                requestBody: requestBody,
                data: null
            };
        }
    }

    /**
     * Configure the schedule manager with tenant details
     * @param {string} endpointUrl - Base URL for the API
     * @param {string} tenantId - Tenant identifier
     */
    configure(endpointUrl, tenantId) {
        // Ensure URL doesn't end with slash
        this.baseUrl = endpointUrl.replace(/\/$/, '');
        this.tenantId = tenantId;
        this.isConfigured = true;
        
        console.log('ScheduleManager configured:', {
            baseUrl: this.baseUrl,
            tenantId: this.tenantId
        });
    }

    /**
     * Get availability for the configured tenant
     * @param {Date} startDate - Start date for availability check (defaults to now)
     * @param {number} numberOfDays - Number of days to check (defaults to 30)
     * @returns {Promise<Object>} API response with availability data
     */
    async getAvailability(startDate = null, numberOfDays = 30) {
        if (!this.isConfigured) {
            throw new Error('ScheduleManager not configured. Call configure() first.');
        }

        // Use current date/time if no start date provided
        const start = startDate || new Date();
        
        // Format date to ISO string
        const startParam = start.toISOString();
        
        // Build the API URL
        const pathname = `api/genesys/callback/${this.tenantId}/availability`;
        const params = new URLSearchParams({
            start: startParam,
            'number-of-days': numberOfDays.toString()
        });
        
        const fullUrl = `${this.baseUrl}/${pathname}?${params.toString()}`;
        
        console.log('Making availability request:', {
            url: fullUrl,
            method: 'GET',
            startDate: start,
            numberOfDays
        });

        try {
            const response = await fetch(fullUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            
            console.log('Availability response received:', data);
            return {
                success: true,
                data: data,
                url: fullUrl,
                status: response.status
            };

        } catch (error) {
            console.error('Error fetching availability:', error);
            
            return {
                success: false,
                error: error.message,
                url: fullUrl,
                data: null
            };
        }
    }

    /**
     * Test the connection to the configured endpoint
     * @returns {Promise<Object>} Connection test result
     */
    async testConnection() {
        if (!this.isConfigured) {
            throw new Error('ScheduleManager not configured. Call configure() first.');
        }

        try {
            // Try to fetch availability for just 1 day as a connection test
            const result = await this.getAvailability(new Date(), 1);
            
            return {
                success: result.success,
                message: result.success ? 'Connection successful' : `Connection failed: ${result.error}`,
                details: result
            };
        } catch (error) {
            return {
                success: false,
                message: `Connection test failed: ${error.message}`,
                details: null
            };
        }
    }

    /**
     * Get the current configuration
     * @returns {Object} Current configuration details
     */
    getConfiguration() {
        return {
            baseUrl: this.baseUrl,
            tenantId: this.tenantId,
            isConfigured: this.isConfigured
        };
    }

    /**
     * Reset the configuration
     */
    reset() {
        this.baseUrl = null;
        this.tenantId = null;
        this.isConfigured = false;
        console.log('ScheduleManager configuration reset');
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScheduleManager;
}