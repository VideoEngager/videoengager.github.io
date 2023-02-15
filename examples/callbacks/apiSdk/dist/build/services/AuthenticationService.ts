/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DefaultError } from '../models/DefaultError';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class AuthenticationService {

    constructor(public readonly httpRequest: BaseHttpRequest) {}

    /**
     * Authenticate Using Partner Access Key
     * User can create token
     * @param pak Partner API Key
     * @param extenalId External ID
     * @param email partner email
     * @returns any Returns a token
     * @returns DefaultError Error
     * @throws ApiError
     */
    public getApiPartnersImpersonate(
pak: string,
extenalId: string,
email: string,
): CancelablePromise<{
token?: string;
token_expiration?: number;
} | DefaultError> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/partners/impersonate/{pak}/{extenalId}/{email}',
            path: {
                'pak': pak,
                'extenalId': extenalId,
                'email': email,
            },
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

}
