import { AxiosHttpRequest } from './core/AxiosHttpRequest';
import { AuthenticationService } from './services/AuthenticationService';
import { CallbacksService } from './services/CallbacksService';
export class Smartvideo {
    constructor(config, HttpRequest = AxiosHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? 'https://prod.leadsecure.com',
            VERSION: config?.VERSION ?? '1.0.0',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });
        this.authentication = new AuthenticationService(this.request);
        this.callbacks = new CallbacksService(this.request);
    }
}
//# sourceMappingURL=Smartvideo.js.map