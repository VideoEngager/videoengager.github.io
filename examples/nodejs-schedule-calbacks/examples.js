import axios from 'axios';

const baseURL = process.env.SMARTVIDEO_BASE_URL || 'https://dev.videoengager.com';
const pak = process.env.SMARTVIDEO_PAK || 'DEV2';
const agentEmail = process.env.SMARTVIDEO_AGENT_EMAIL || '327d10eb-0826-42cd-89b1-353ec67d33f8slav@videoengager.com';
const extenalId = process.env.SMARTVIDEO_EXTERNAL_ID || 'Home';
const tenantId = process.env.SMARTVIDEO_TENANT_ID || 'test_tenant';
let token;

/**
 * @function generateSmartvideoToken
 * @description Generate a token for the Smartvideo API
 * @returns {Promise<string>}
 */
async function generateSmartvideoToken () {
  try {
    if (token) {
      return token;
    }
    const response = await axios.get(baseURL + `/api/partners/impersonate/{${pak}}/{${extenalId}}/{${agentEmail}}`);
    console.log(response);
    token = response.data.token;
    return response.data.token;
  } catch (error) {
    console.error(error);
    token = null;
    return null;
  }
}

/**
 * @function createNewCallback
 * @description Create a new callback
 * @see https://api-staging.videoengager.com/genesys_callback_api
 * @param {Object} params
 * @param {string} params.firstname - Customer First Name
 * @param {string} params.lastname - Customer Last Name
 * @param {string} params.customer_email - Customer Email
 * @param {string} params._customer_number - Customer Phone number - must be at least 5 digits starting with a +
 * @param {string} params._desired_time - ISO Date of the desired callback time
 * @param {string} params.veSubject - Subject to show to the agent (same as customer_subject)
 * @param {string} params.customer_subject - Subject to show to the agent (same as veSubject)
 * @param {string} params.preferedAgent - (optional) Agent ID to prefer when routing the customer
 * @param {boolean} params.callbackOwned - (optional) If the callback is owned by the agent - only works if preferedAgent is set
 * @param {string} params.environment - Genesys Cloud environment E.g. https://api.mypurecloud.com.au
 * @returns {Promise<ReturnedCallback>}
 * @example createNewCallback({
 * firstname: 'Mamoun',
 * lastname: 'Hourani',
 * customer_email: 'email@callback.com',
 * _customer_number: '+61412345678',
 * _desired_time: '2021-05-20T10:00:00.000Z',
 * veSubject: 'Test',
 * customer_subject: 'Test',
 * preferedAgent: '1234567890',
 * callbackOwned: true,
 * environment: 'https://api.mypurecloud.com.au'
 * })
 */
export async function createNewCallback (params) {
  try {
    const token = await generateSmartvideoToken();
    const response = await axios.post(baseURL + `/api/genesys/callback/tenant/{${tenantId}}`, params, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log(response);
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

/**
 * @function deleteCallbackByScheduleId
 * @description Delete a callback by schedule ID
 * @see https://api-staging.videoengager.com/genesys_callback_api
 * @param {string} scheduleId - Schedule ID
 * @returns {Promise<ReturnedCallback>}
 * @example deleteCallbackByScheduleId('1234567890')
 * @example deleteCallbackByScheduleId('1234567890').then((response) => console.log(response))
 *  */
export async function deleteCallbackByScheduleId (scheduleId) {
  try {
    const token = await generateSmartvideoToken();
    const response = await axios.delete(baseURL + `/api/genesys/callback/byScheduleId/tenant/{${tenantId}}/{${scheduleId}}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log(response);
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

/**
 * @function listAllCallbacks
 * @description List all callbacks between two dates
 * @see https://api-staging.videoengager.com/genesys_callback_api
 * @param {string} from - ISO Date of the start date
 * @param {string} to - ISO Date of the end date
 * @returns {Promise<MultipleSchedules>}
 * @example listAllCallbacks('2021-05-20T10:00:00.000Z', '2021-05-20T10:00:00.000Z')
 * @example listAllCallbacks('2021-05-20T10:00:00.000Z', '2021-05-20T10:00:00.000Z').then((response) => console.log(response))
 * */
export async function listAllCallbacks (from, to) {
  try {
    const token = await generateSmartvideoToken();
    const response = await axios.get(baseURL + `/api/schedules/tenant/{${from}}/{${to}}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    return [];
  }
}

/**
 * @typedef {object} ReturnedCallback
 * @property {object} genesys
 * @property {object} genesys.conversation
 * @property {string} genesys.conversation.id - Conversation ID
 * @property {string} genesys.conversation.selfUri
 * @property {object[]} genesys.callbackIdentifiers
 * @property {string} genesys.callbackIdentifiers.type
 * @property {string} genesys.callbackIdentifiers.id
 * @property {object} videoengager
 * @property {boolean} videoengager.autoAnswer
 * @property {string} videoengager.name - Customer Name
 * @property {string} videoengager.email - Customer Email
 * @property {string} videoengager.phone - Customer Phone
 * @property {string} videoengager.subject - Subject
 * @property {string} videoengager.meetingUrl - Meeting URL
 * @property {string} videoengager.code - Meeting Code
 * @property {number} videoengager.date - Meeting Date
 * @property {string} videoengager.agentUrl - Agent URL
 * @property {boolean} videoengager.emailSent  - If the email was sent
 * @property {string} icsCalendarData - ICS Calendar Data
    */

/**
 * @typedef {object} singleSchedule
 * @property {string} _id
 * @property {object} visitor
 * @property {boolean} visitor.autoAnswer
 * @property {string} visitor.name
 * @property {string} visitor.email
 * @property {string} visitor.phone
 * @property {string} visitor.meetingUrl
 * @property {string} visitor.code
 * @property {boolean} active
 * @property {number} pin
 * @property {number} date
 * @property {number} duration
 * @property {string} preferedAgent
 * @property {string} tenant
 * @property {string} agentId
 * @property {object} agent
 * @property {string} agent.email
 * @property {string} agent.name
 * @property {string} agent.meetingUrl
 * @property {string} agent.code
 * @property {string} conversationId
 */
/**
 * @typedef {Array<singleSchedule>} MultipleSchedules
 */
