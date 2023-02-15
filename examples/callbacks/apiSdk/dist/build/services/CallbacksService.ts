/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { callbackObject } from '../models/callbackObject';
import type { callbacksList } from '../models/callbacksList';
import type { DefaultError } from '../models/DefaultError';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class CallbacksService {

    constructor(public readonly httpRequest: BaseHttpRequest) {}

    /**
     * List Short Urls for specific tennant.
     * Returns the interactions for the current authorised user for a given time period. The result is paginated.
     * @param tenantId Tenant ID
     * @param from start of the period
     * @param to End of the period
     * @param agentEmail filter result for specific agent by agent email
     * @param orderBy 
     * @param asc 
     * @param pageSize 
     * @param page 
     * @returns callbacksList successful operation
     * @returns DefaultError Error
     * @throws ApiError
     */
    public getApiGenesysCallbackListTenant(
tenantId: string,
from: string,
to: string,
agentEmail?: string,
orderBy?: 'duration' | 'created' | 'date' | 'canceled',
asc?: 0 | 1,
pageSize: number = 100,
page: number = 1,
): CancelablePromise<callbacksList | DefaultError> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/genesys/callback/list/tenant/{tenantId}/{from}/{to}',
            path: {
                'tenantId': tenantId,
                'from': from,
                'to': to,
            },
            query: {
                'agentEmail': agentEmail,
                'orderBy': orderBy,
                'asc': asc,
                'pageSize': pageSize,
                'page': page,
            },
            errors: {
                400: `Bad request`,
                401: `Unauthorized`,
                403: `Unauthorized | user is not member of organization`,
                404: `Not Found`,
                429: `Too Many requests`,
            },
        });
    }

    /**
     * Create New Callback
     * Notes.  *URL* is required, transferID is needed if you want to be able to deactive it later, pin will not be applied if brokerage settings doesn't allow it, if code is not provided, code automatically will be generated.
     * @param tenantId Tennant ID
     * @param requestBody 
     * @returns callbackObject OK
     * @returns DefaultError Error
     * @throws ApiError
     */
    public postApiGenesysCallbackTenant(
tenantId: string,
requestBody: {
/**
 * used to add agent ID preferred routing, MUST exist if callbackOwned is True;
 */
preferedAgent?: string;
/**
 * used to give prefered Agent ownership of the callback, will not work without prefered Agent ID
 */
callbackOwned?: boolean;
firstname: string;
lastname?: string;
customer_email: string;
/**
 * Identify the creater of the scheduled meeting.
 */
creator?: string;
_customer_number: string;
_desired_time: string;
veSubject?: string;
customer_subject?: string;
},
): CancelablePromise<callbackObject | DefaultError> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/genesys/callback/tenant/{tenantId}',
            path: {
                'tenantId': tenantId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request`,
                401: `Unauthorized`,
                403: `Unauthorized | user is not member of organization`,
                404: `Not Found`,
                415: `Unsupported payload`,
                429: `Too Many requests`,
            },
        });
    }

    /**
     * deactivate ShortURL
     * used to deactive remove callback by schedule ID
     * @param tenantId Tennant ID
     * @param scheduleId Schedule ID
     * @returns callbackObject OK
     * @returns DefaultError Error
     * @throws ApiError
     */
    public deleteApiGenesysCallbackByScheduleIdTenant(
tenantId: string,
scheduleId: string,
): CancelablePromise<callbackObject | DefaultError> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/genesys/callback/byScheduleId/tenant/{tenantId}/{scheduleId}',
            path: {
                'tenantId': tenantId,
                'scheduleId': scheduleId,
            },
            errors: {
                401: `Unauthorized`,
                403: `Unauthorized | user is not member of organization`,
                404: `Not Found`,
            },
        });
    }

    /**
     * deactivate ShortURL
     * used to deactive remove callback by conversation ID
     * @param tenantId Tennant ID
     * @param conversationId Conversation ID
     * @returns callbackObject OK
     * @returns DefaultError Error
     * @throws ApiError
     */
    public deleteCallbackByConversationId(
tenantId: string,
conversationId: string,
): CancelablePromise<callbackObject | DefaultError> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/genesys/callback/tenant/{tenantId}/{conversationId}',
            path: {
                'tenantId': tenantId,
                'conversationId': conversationId,
            },
            errors: {
                401: `Unauthorized`,
                403: `Unauthorized | user is not member of organization`,
                404: `Not Found`,
            },
        });
    }

    /**
     * Get Single Callback
     * used to retrieve callback by conversation id
     * @param tenantId Tennant ID
     * @param conversationId Conversation ID
     * @returns callbackObject OK
     * @returns DefaultError Error
     * @throws ApiError
     */
    public getCallbackByConversationId(
tenantId: string,
conversationId: string,
): CancelablePromise<callbackObject | DefaultError> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/genesys//callback/tenant/{tenantId}/{conversationId}',
            path: {
                'tenantId': tenantId,
                'conversationId': conversationId,
            },
            errors: {
                401: `Unauthorized`,
                403: `Unauthorized | user is not member of organization`,
                404: `Not Found`,
            },
        });
    }

}
