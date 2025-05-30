// @ts-check
import { configs, metadata } from "./conf.js";
export class EnvironmentConfig {
  constructor() {
    this.env = this.detectEnvironment();
    this.config = this.loadConfig();
    this.metadata = this.loadMetadata();
    this.validateConfig();
  }

  /**
   * Detects the environment based on hostname and URL parameters.
   * @returns {string} The detected environment ('development', 'staging', or 'production').
   */
  detectEnvironment() {
    const hostname = window.location.hostname;
    const urlParams = new URLSearchParams(window.location.search);
    const envParam = urlParams.get("env");
    
    const validEnvs = ["dev", "staging", "production"];
    return (envParam && validEnvs.includes(envParam)) ? envParam : (() => {
      const patterns = {
        dev: /(dev|localhost|127\.0\.0\.1|192\.168)/,
        staging: /staging/,
        production: /^(app\.|www\.|[^.]*\.com$)/
      };
      
      return Object.entries(patterns)
        .find(([env, pattern]) => pattern.test(hostname))?.[0] || 'production';
    })();
  }

  /**
   * Loads the configuration based on the detected environment.
   * @returns {Object} The configuration object for the current environment.
   */
  loadConfig() {
    return configs[this.env];
  }

  loadMetadata() {
    return metadata;
  }

  validateConfig() {
    const required = {
      videoEngager: ["tenantId", "veEnv"],
      genesys: ["deploymentId", "domain"],
    };

    const errors = [];

    Object.entries(required).forEach(([section, fields]) => {
      if (!this.config[section]) {
        errors.push(`Missing configuration section: ${section}`);
        return;
      }

      fields.forEach((field) => {
        if (!this.config[section][field]) {
          errors.push(`Missing required field: ${section}.${field}`);
        }
      });
    });

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join("\n")}`);
    }
  }

  getConfig() {
    return { ...this.config };
  }

  getEnvironment() {
    return this.env;
  }
}
