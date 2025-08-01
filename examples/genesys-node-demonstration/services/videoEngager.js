/**
 * Simple VideoEngager Service
 * Using your existing logic
 */

const axios = require('axios');
const https = require('https');

class VideoEngagerService {
    constructor() {
        this.domain = process.env.VE_DOMAIN || 'dev.videoengager.com';
        this.pak = process.env.VE_PAK;
        this.externalId = process.env.VE_EXTERNAL_ID;
        this.email = process.env.VE_EMAIL;
        
        // Configure axios with SSL settings
        this.httpsAgent = new https.Agent({
            rejectUnauthorized: process.env.NODE_ENV === 'production'
        });
        this.httpClient = axios.create({
            timeout: 10000,
            httpsAgent: this.httpsAgent
        });
    }
    
    async authenticate(requestId) {
        try {
            console.log(`[${requestId}] Authenticating with VideoEngager...`);
            
            const response = await this.httpClient.get(
                `https://${this.domain}/api/partners/impersonate/${this.pak}/${this.externalId}/${this.email}`
            );
            
            const token = response.data.token;
            console.log(`[${requestId}] VideoEngager authentication successful`);
            return token;
            
        } catch (error) {
            console.error(`[${requestId}] VideoEngager authentication failed:`, error.message);
            throw new Error('Failed to authenticate with VideoEngager');
        }
    }
    
    async createMeeting(meetingData, requestId) {
        try {
            console.log(`[${requestId}] Creating VideoEngager meeting...`);
            
            const token = await this.authenticate(requestId);
            
            const scheduleData = {
                customerId: meetingData.customerId,
                date: new Date(meetingData.scheduledTime).getTime(),
                duration: meetingData.duration || 30,
                visitor: {}
            };
            
            const response = await this.httpClient.post(
                `https://${this.domain}/api/schedules/my/`,
                scheduleData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const meeting = response.data;
            
            const result = {
                id: meeting._id,
                customerUrl: meeting.visitor?.meetingUrl || `https://${this.domain}/ve/${meeting.id}`,
                agentUrl: meeting.agent?.meetingUrl || `https://${this.domain}/agent/${meeting.id}`,
                scheduledTime: meetingData.scheduledTime,
                duration: meetingData.duration || 30
            };
            
            console.log(`[${requestId}] VideoEngager meeting created:`, result.id);
            return result;
            
        } catch (error) {
            console.error(`[${requestId}] Failed to create VideoEngager meeting:`, error.message);
            throw new Error('Failed to create VideoEngager meeting');
        }
    }

    async patchCallback(scheduleId, requestId, body = {}) {
        try {
            console.log(`[${requestId}] Patching VideoEngager meeting ${scheduleId}...`);
            
            if (Object.keys(body).length <= 0) {
                throw new Error('While trying to patch scheduled meeting body was found empty');
            } 

            const token = await this.authenticate(requestId);
            
            const scheduleData = {
                conversationId: body.conversationId
            };
            
            const response = await this.httpClient.put(
                `https://${this.domain}/api/schedules/my/${scheduleId}`,
                scheduleData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const meeting = response.data;
            
            const result = {
                id: meeting._id,
                customerUrl: meeting.visitor?.meetingUrl || `https://${this.domain}/ve/${meeting.id}`,
                agentUrl: meeting.agent?.meetingUrl || `https://${this.domain}/agent/${meeting.id}`,
                conversationId: body.conversationId
            };
            
            console.log(`[${requestId}] VideoEngager meeting patched:`, result.id);
            return result;
            
        } catch (error) {
            console.error(`[${requestId}] Failed to patch VideoEngager meeting:`, error.message);
            throw new Error('Failed to patch VideoEngager meeting');
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

module.exports = { VideoEngagerService };