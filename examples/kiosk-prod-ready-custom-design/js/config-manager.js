// js/config-manager.js
import { restoreAuthConfig, restoreConfigAfterReload } from './auth.js';
/**
 * Simple deep merge function.
 * @param {object} target - The target object to merge into.
 * @param {object} source - The source object to merge from.
 * @returns {object} The merged target object.
 */
function deepMerge (target, source) {
  for (const key of Object.keys(source)) {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('Invalid configuration key');
    if (Array.isArray(source[key])) {
      target[key] = [...source[key]];
    } else if (source[key] && typeof source[key] === 'object') {
      if (!target[key]) {
        Object.assign(target, { [key]: {} });
      }
      deepMerge(target[key], source[key]);
    } else {
      Object.assign(target, { [key]: source[key] });
    }
  }
  return target;
}
export class ConfigManager {
  constructor (defaultConfig) {
    this.defaultConfig = defaultConfig;
    this.config = {};
  }

  validateCustomerConfig (cfg) {
    // Minimal schema checks; your client also validates them.
    const need = [['videoEngager', 'tenantId'], ['videoEngager', 'veEnv'], ['genesys', 'deploymentId'], ['genesys', 'domain']];
    for (const [a, b] of need) {
      if (!cfg?.[a]?.[b]) throw new Error(`Missing ${a}.${b}`);
    }
    return cfg;
  }

  async load () {
    const savedConfig = restoreAuthConfig() || restoreConfigAfterReload();
    if (savedConfig) return (this.config = this.validateCustomerConfig(savedConfig));
    // 1. Start with the default config
    this.config = { ...this.defaultConfig };

    // // @TODO Validate need for local torage 2. Load from localStorage

    // 3. Load from URL parameters (highest precedence)
    const p = new URLSearchParams(location.search);
    if (p.get('config')) {
      try {
        const configUrl = p.get('config');
        const parsed = new URL(configUrl, location.href);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:' && parsed.protocol !== 'blob:') {
          throw new Error(`Unsafe config URL scheme: ${parsed.protocol}`);
        }
        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 10000);
        try {
          const res = await fetch(parsed.href, { cache: 'no-store', signal: controller.signal });
          const ext = await res.json();
          this.config = deepMerge(this.config, this.validateCustomerConfig(ext));
        } finally {
          clearTimeout(fetchTimeout);
        }
      } catch (e) {
        throw new Error(`External config failed: ${e.message}`);
      }
    }
    const urlConfig = this.loadFromUrl();
    this.config = deepMerge(this.config, urlConfig);

    // @TODO Validate need for local torage, it creates issues. 4. Save the merged config back to localStorage for persistence.

    return this.config;
  }

  loadFromUrl () {
    const params = new URLSearchParams(window.location.search);
    const urlConfig = {};

    // Map URL parameters to their corresponding path in the config object.
    const paramMap = {
      genesysDeploymentId: 'genesys.deploymentId',
      genesysDomain: 'genesys.domain',
      veTenantId: 'videoEngager.tenantId',
      veEnv: 'videoEngager.veEnv',
      interactive: 'useGenesysMessengerChat',
      auth: 'auth.enabled',
      authMode: 'auth.mode',
      authorizationEndpoint: 'auth.authorizationEndpoint',
      clientId: 'auth.clientId',
      scopes: 'auth.scopes',
      debug: 'debug'
    };

    // Helper function to safely set a value in a nested object.
    const setValue = (obj, path, value) => {
      const keys = path.split('.');
      let current = obj;
      // Iterate through keys, creating nested objects if they don't exist.
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = current[key] || {};
        current = current[key];
      }
      // Set the final value.
      if (value === 'true' || value === 'false') {
        current[keys[keys.length - 1]] = value === 'true';
      } else {
        current[keys[keys.length - 1]] = value;
      }
    };

    // Process each mapped parameter that exists in the URL.
    for (const [param, path] of Object.entries(paramMap)) {
      if (params.has(param)) {
        setValue(urlConfig, path, param === 'scopes' ? params.get(param).trim().split(/\s+/) : params.get(param));
      }
    }

    // Add a reset mechanism
    if (params.has('clearConfig') && params.get('clearConfig') === 'true') {
      localStorage.removeItem('kioskConfig');
      window.location.href = window.location.pathname; // Reload without params
    }

    return urlConfig;
  }

  loadFromStorage () {
    const stored = localStorage.getItem('kioskConfig');
    if (!stored) return {};
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse stored config, ignoring:', e);
      localStorage.removeItem('kioskConfig');
      return {};
    }
  }

  saveToStorage () {
    localStorage.setItem('kioskConfig', JSON.stringify(this.config));
  }

  get (key) {
    return this.config[key];
  }
}
