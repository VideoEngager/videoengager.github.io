export class AuthenticationService {
    constructor(httpRequest) {
        this.httpRequest = httpRequest;
    }
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
    getApiPartnersImpersonate(pak, extenalId, email) {
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
//# sourceMappingURL=AuthenticationService.js.map