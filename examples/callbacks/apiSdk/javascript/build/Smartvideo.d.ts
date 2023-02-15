import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { AuthenticationService } from './services/AuthenticationService';
import { CallbacksService } from './services/CallbacksService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export declare class Smartvideo {
    readonly authentication: AuthenticationService;
    readonly callbacks: CallbacksService;
    readonly request: BaseHttpRequest;
    constructor(config?: Partial<OpenAPIConfig>, HttpRequest?: HttpRequestConstructor);
}
export {};
//# sourceMappingURL=Smartvideo.d.ts.map