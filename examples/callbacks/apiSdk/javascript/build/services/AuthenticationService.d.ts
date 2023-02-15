import type { DefaultError } from '../models/DefaultError';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export declare class AuthenticationService {
    readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest);
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
    getApiPartnersImpersonate(pak: string, extenalId: string, email: string): CancelablePromise<{
        token?: string;
        token_expiration?: number;
    } | DefaultError>;
}
//# sourceMappingURL=AuthenticationService.d.ts.map