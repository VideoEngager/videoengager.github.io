import { Smartvideo, OpenAPI } from './build/index';
export const smartvideoClient = new Smartvideo({
    BASE: 'https://dev.videoengager.com'
});
export function setToken(token) {
    OpenAPI.TOKEN = token;
    smartvideoClient.request.config.TOKEN = token;
}
let config;
/**
 *
 * @param {*} configuration
 */
export function setConfiguration(configuration) {
    OpenAPI.BASE = configuration.base;
    config = configuration;
    smartvideoClient.request.config.BASE = configuration.base;
}
/**
 * Initialize smartvideo client
 * @function initializeSmartvideo
 * @returns {Promise<void>}
 */
export async function initializeSmartvideo() {
    if (!config) {
        throw new Error('Configuration is not set');
    }
    try {
        const res = await smartvideoClient.authentication.getApiPartnersImpersonate(config.pak, config.externalId, config.email);
        // @ts-ignore
        setToken(res.token);
    }
    catch (e) {
        throw e;
    }
}
//# sourceMappingURL=callback-sdk.js.map