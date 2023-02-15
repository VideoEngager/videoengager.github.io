import { BaseHttpRequest } from './BaseHttpRequest';
import { request as __request } from './request';
export class AxiosHttpRequest extends BaseHttpRequest {
    constructor(config) {
        super(config);
    }
    /**
     * Request method
     * @param options The request options from the service
     * @returns CancelablePromise<T>
     * @throws ApiError
     */
    request(options) {
        return __request(this.config, options);
    }
}
//# sourceMappingURL=AxiosHttpRequest.js.map