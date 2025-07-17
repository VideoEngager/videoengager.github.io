/**
 * Simple Genesys Service
 * Using your existing logic
 */

const axios = require('axios');
const https = require('https');

class GenesysService {
    constructor() {
        this.environment = process.env.GENESYS_ENVIRONMENT;
        this.clientId = process.env.GENESYS_CLIENT_ID;
        this.clientSecret = process.env.GENESYS_CLIENT_SECRET;
        this.queueId = process.env.GENESYS_QUEUE_ID;
        this.scriptId = process.env.GENESYS_SCRIPT_ID;
        
        // Create axios instance
        this.httpClient = axios.create({
            timeout: 10000,
            httpsAgent: new https.Agent({
                rejectUnauthorized: process.env.NODE_ENV === 'production'
            })
        });
    }
    
    async authenticate(requestId) {
        try {
            console.log(`[${requestId}] Authenticating with Genesys...`);
            
            const response = await this.httpClient.post(
                `https://login.${this.environment}/oauth/token`,
                new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: this.clientId,
                    client_secret: this.clientSecret
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
            
            console.log(`[${requestId}] Genesys authentication successful`);
            return response.data.access_token;
            
        } catch (error) {
            console.error(`[${requestId}] Genesys authentication failed:`, error.message);
            throw new Error('Failed to authenticate with Genesys');
        }
    }
    
    async scheduleCallback(callbackData, requestId) {
        try {
            console.log(`[${requestId}] Creating Genesys callback...`);
            
            const token = await this.authenticate(requestId);
            
            const genesysCallbackData = {
                phoneNumber: callbackData.phoneNumber,
                queueId: this.queueId,
                scriptId: this.scriptId,
                callbackNumbers: [callbackData.phoneNumber],
                callbackScheduledTime: new Date(callbackData.scheduledTime).toISOString(),
                data: {
                    customerId: callbackData.customerId,
                    subject: callbackData.subject,
                    veScheduleId: callbackData.videoMeetingInfo?.meetingId,
                    veUrl: callbackData?.videoMeetingInfo?.visitorUrl
                }
            };
            
            const response = await this.httpClient.post(
                `https://api.${this.environment}/api/v2/conversations/callbacks`,
                genesysCallbackData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const callback = response.data;
            
            const result = {
                id: callback.conversation?.id,
                conversationId: callback.conversation?.id,
                scheduledTime: callbackData.scheduledTime,
                customerId: callbackData.customerId
            };
            
            console.log(`[${requestId}] Genesys callback created:`, result.id);
            return result;
            
        } catch (error) {
            console.error(`[${requestId}] Failed to create Genesys callback:`, error.message);
            throw new Error('Failed to create Genesys callback');
        }
    }
    
    async checkHealth() {
        try {
            // Simple health check
            return { status: 'healthy' };
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }
}

module.exports = { GenesysService };