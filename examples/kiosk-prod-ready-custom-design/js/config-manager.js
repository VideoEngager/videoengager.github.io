// js/config-manager.js
/**
 * Simple deep merge function.
 * @param {object} target - The target object to merge into.
 * @param {object} source - The source object to merge from.
 * @returns {object} The merged target object.
 */
function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object') {
            if (!target[key]) {
                Object.assign(target, { [key]: {} });
            }
            deepMerge(target[key], source[key]);
        } else {
            Object.assign(target, { [key]: source[key] });
        }
    }
    return target;
};
export class ConfigManager {
  constructor(defaultConfig) {
    this.defaultConfig = defaultConfig;
    this.config = {};
  }

  async load() {
    // 1. Start with the default config
    this.config = { ...this.defaultConfig };

    // 2. Load from localStorage
    const storedConfig = this.loadFromStorage();
    this.config = deepMerge(this.config, storedConfig );

    // 3. Load from URL parameters (highest precedence)
    const urlConfig = this.loadFromUrl();
    this.config = deepMerge(this.config, urlConfig);
    
    // 4. Save the merged config back to localStorage for persistence
    this.saveToStorage();

    return this.config;
  }

  loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const urlConfig = {};

    // Map URL parameters to their corresponding path in the config object.
    const paramMap = {
        'genesysDeploymentId': 'genesys.deploymentId',
        'genesysDomain':       'genesys.domain',
        'veTenantId':          'videoEngager.tenantId',
        'veEnv':               'videoEngager.veEnv',
        'interactive':         'useGenesysMessengerChat'
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
            setValue(urlConfig, path, params.get(param));
        }
    }

    // Add a reset mechanism
    if (params.has('clearConfig') && params.get('clearConfig') === 'true') {
        localStorage.removeItem('kioskConfig');
        window.location.href = window.location.pathname; // Reload without params
    }

    return urlConfig;
  }

  loadFromStorage() {
    const stored = localStorage.getItem('kioskConfig');
    return stored ? JSON.parse(stored) : {};
  }

  saveToStorage() {
    localStorage.setItem('kioskConfig', JSON.stringify(this.config));
  }

  get(key) {
    return this.config[key];
  }
}