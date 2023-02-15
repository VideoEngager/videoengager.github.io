import { Smartvideo, OpenAPI } from './build/index';
import {Configuration} from './types';
export const smartvideoClient = new Smartvideo({
  BASE: 'https://dev.videoengager.com'

});

export function setToken (token: string) {
  OpenAPI.TOKEN = token;
  smartvideoClient.request.config.TOKEN = token;
}
let config: Configuration
/**
 *
 * @param {*} configuration
 */
export function setConfiguration (configuration: Configuration) {
  OpenAPI.BASE = configuration.base;
  config = configuration;
  smartvideoClient.request.config.BASE = configuration.base;
}

/**
 * Initialize smartvideo client
 * @function initializeSmartvideo
 * @returns {Promise<void>}
 */
export async function initializeSmartvideo () {
  if (!config) {
    throw new Error('Configuration is not set');
  }
  try{
    const res = await smartvideoClient.authentication.getApiPartnersImpersonate(config.pak, config.externalId, config.email);
    // @ts-ignore
    setToken(res.token);
  } catch (e) {
    throw e;
  }
}

