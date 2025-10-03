/* eslint-disable @typescript-eslint/no-explicit-any */
// utils/ConfigManager.ts
import type { VideoEngagerConnectionConfigs } from "@videoengager-widget/js/core";
import type { GenesysConfigs } from "@videoengager-widget/js/integrations";

export interface ConfigurationInterface {
  videoEngager: VideoEngagerConnectionConfigs & { isPopup: boolean, debug?: boolean };
  genesys: GenesysConfigs;
  useGenesysMessengerChat: boolean;
  debug?: boolean;
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Simple deep merge function.
 * @param target - The target object to merge into.
 * @param source - The source object to merge from.
 * @returns The merged target object.
 */
function deepMerge<T extends Record<string, any>>(
  target: T,
  source: DeepPartial<T>
): T {
  const result = { ...target };
  
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];
    
    if (
      sourceValue &&
      typeof sourceValue === "object" &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === "object" &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as any;
    }
  }
  
  return result;
}

export class ConfigManager {
  private config: ConfigurationInterface;
  
  constructor(private defaultConfig: ConfigurationInterface) {
    this.config = { ...defaultConfig };
  }

  /**
   * Validates that required configuration fields are present.
   */
  private validateCustomerConfig(
    cfg: DeepPartial<ConfigurationInterface>
  ): DeepPartial<ConfigurationInterface> {
    const required: Array<[string, string]> = [
      ["videoEngager", "tenantId"],
      ["videoEngager", "veEnv"],
      ["genesys", "deploymentId"],
      ["genesys", "domain"],
    ];

    for (const [section, field] of required) {
      const value = (cfg as any)?.[section]?.[field];
      if (!value) {
        throw new Error(`Missing required config: ${section}.${field}`);
      }
    }

    return cfg;
  }

  /**
   * Loads configuration from URL parameters.
   */
  private loadFromUrl(): DeepPartial<ConfigurationInterface> {
    const params = new URLSearchParams(window.location.search);
    const urlConfig: DeepPartial<ConfigurationInterface> = {};

    // Map URL parameters to their corresponding path in the config object
    const paramMap: Record<string, string> = {
      genesysDeploymentId: "genesys.deploymentId",
      genesysDomain: "genesys.domain",
      veTenantId: "videoEngager.tenantId",
      veEnv: "videoEngager.veEnv",
      interactive: "useGenesysMessengerChat",
      debug: "debug",
      isPopup: "videoEngager.isPopup",
    };

    // Helper function to safely set a value in a nested object
    const setValue = (
      obj: Record<string, any>,
      path: string,
      value: string
    ) => {
      const keys = path.split(".");
      let current = obj;

      // Iterate through keys, creating nested objects if they don't exist
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = current[key] || {};
        current = current[key];
      }

      // Set the final value with type conversion
      const finalKey = keys[keys.length - 1];
      if (value === "true" || value === "false") {
        current[finalKey] = value === "true";
      } else {
        current[finalKey] = value;
      }
    };

    // Process each mapped parameter that exists in the URL
    for (const [param, path] of Object.entries(paramMap)) {
      if (params.has(param)) {
        setValue(urlConfig, path, params.get(param)!);
      }
    }

    return urlConfig;
  }

  /**
   * Loads configuration from an external JSON file.
   */
  private async loadFromExternalUrl(
    url: string
  ): Promise<DeepPartial<ConfigurationInterface>> {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const ext = await res.json();
      return this.validateCustomerConfig(ext);
    } catch (e) {
      console.warn("External config failed:", e);
      return {};
    }
  }

  /**
   * Loads the complete configuration in order of precedence:
   * 1. Default config (lowest priority)
   * 2. External config file (if config URL param provided)
   * 3. URL parameters (highest priority)
   */
  async load(): Promise<ConfigurationInterface> {
    // Start with the default config
    this.config = { ...this.defaultConfig };

    // Load from external config file if URL param provided
    const params = new URLSearchParams(window.location.search);
    if (params.get("config")) {
      const externalConfig = await this.loadFromExternalUrl(
        params.get("config")!
      );
      this.config = deepMerge(this.config, externalConfig);
    }

    // Load from URL parameters (highest precedence)
    const urlConfig = this.loadFromUrl();
    this.config = deepMerge(this.config, urlConfig);

    return this.config;
  }

  /**
   * Merges additional configuration into the current config.
   */
  merge(partial: DeepPartial<ConfigurationInterface>): ConfigurationInterface {
    this.config = deepMerge(this.config, partial);
    return this.config;
  }

  /**
   * Gets the current configuration.
   */
  getConfig(): ConfigurationInterface {
    return this.config;
  }

  /**
   * Gets a specific configuration value by key.
   */
  get<K extends keyof ConfigurationInterface>(
    key: K
  ): ConfigurationInterface[K] {
    return this.config[key];
  }

  /**
   * Sets the entire configuration.
   */
  setConfig(config: ConfigurationInterface): void {
    this.config = config;
  }
}

/**
 * Creates a ConfigManager instance with a preset configuration.
 */
export function createConfigManager(
  preset: ConfigurationInterface
): ConfigManager {
  return new ConfigManager(preset);
}
