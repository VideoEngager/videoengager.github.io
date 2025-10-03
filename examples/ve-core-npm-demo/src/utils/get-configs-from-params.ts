import type { ConfigurationInterface } from "./ConfigManager";



export function getConfigsFromParams(params: URLSearchParams = getUrlParams()) {

    const config = params.get("config");
    if (!config) {
        throw new Error();
    }
    const parsedConfig = JSON.parse(atob(config));
    return parsedConfig as {
        loadedConfig: ConfigurationInterface,
        customAttributes: Record<string, string>,
    }
}

export function getUrlParams() {
    const urlSearchParams = new URLSearchParams(window.location.hash.split('?')[1]);
    return urlSearchParams;
}