import type { callbackObject } from '../models/callbackObject';
import type { callbacksList } from '../models/callbacksList';
import type { DefaultError } from '../models/DefaultError';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export declare class CallbacksService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
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
    getApiGenesysCallbackListTenant(tenantId: string, from: string, to: string, agentEmail?: string, orderBy?: 'duration' | 'created' | 'date' | 'canceled', asc?: 0 | 1, pageSize?: number, page?: number): CancelablePromise<callbacksList | DefaultError>;
    /**
     * Create New Callback
     * Notes.  *URL* is required, transferID is needed if you want to be able to deactive it later, pin will not be applied if brokerage settings doesn't allow it, if code is not provided, code automatically will be generated.
     * @param tenantId Tennant ID
     * @param requestBody
     * @returns callbackObject OK
     * @returns DefaultError Error
     * @throws ApiError
     */
    postApiGenesysCallbackTenant(tenantId: string, requestBody: {
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
    }): CancelablePromise<callbackObject | DefaultError>;
    /**
     * deactivate ShortURL
     * used to deactive remove callback by schedule ID
     * @param tenantId Tennant ID
     * @param scheduleId Schedule ID
     * @returns callbackObject OK
     * @returns DefaultError Error
     * @throws ApiError
     */
    deleteApiGenesysCallbackByScheduleIdTenant(tenantId: string, scheduleId: string): CancelablePromise<callbackObject | DefaultError>;
    /**
     * deactivate ShortURL
     * used to deactive remove callback by conversation ID
     * @param tenantId Tennant ID
     * @param conversationId Conversation ID
     * @returns callbackObject OK
     * @returns DefaultError Error
     * @throws ApiError
     */
    deleteCallbackByConversationId(tenantId: string, conversationId: string): CancelablePromise<callbackObject | DefaultError>;
    /**
     * Get Single Callback
     * used to retrieve callback by conversation id
     * @param tenantId Tennant ID
     * @param conversationId Conversation ID
     * @returns callbackObject OK
     * @returns DefaultError Error
     * @throws ApiError
     */
    getCallbackByConversationId(tenantId: string, conversationId: string): CancelablePromise<callbackObject | DefaultError>;
}
//# sourceMappingURL=CallbacksService.d.ts.map