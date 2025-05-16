
/**
 * Configuration manager for VideoEngager integration
 */
class ConfigManager {
  constructor() {
    this.config = loadDefaultConfigs();
  }

  /**
   * Load configuration from form
   * @param {HTMLFormElement} form - The configuration form
   * @returns {Object} - The configuration object
   */
  loadFromForm(form) {
    // VideoEngager settings
    this.config.videoEngager.tenantId = form.tenantId.value.trim();
    this.config.videoEngager.veEnv = form.veEnv.value.trim();
    this.config.videoEngager.veHttps = form.veHttps.checked;
    this.config.videoEngager.isPopup = form.isPopup.checked;
  
    // Genesys settings
    this.config.genesys.deploymentId = form.deploymentId.value.trim();
    
    // Environment or domain (one is required)
    const environment = form.environment.value.trim();
    const domain = form.domain.value.trim();
    
    if (environment) {
      this.config.genesys.environment = environment;
      delete this.config.genesys.domain;
    } else if (domain) {
      this.config.genesys.domain = domain;
      delete this.config.genesys.environment;
    } else {
      throw new Error('Either environment or domain must be provided');
    }

    // Integration settings
    this.config.useGenesysMessengerChat = form.useGenesysMessengerChat.checked;
    
    // Script URL
    this.config.scriptUrl = form.scriptUrl.value.trim();

    return this.config;
  }

  /**
   * Validate the configuration
   * @returns {boolean} - True if configuration is valid
   * @throws {Error} - If configuration is invalid
   */
  validate() {
    // Check required fields
    if (!this.config.videoEngager.tenantId) {
      throw new Error('Tenant ID is required');
    }
    
    if (!this.config.videoEngager.veEnv) {
      throw new Error('VideoEngager environment is required');
    }
    
    if (!this.config.genesys.deploymentId) {
      throw new Error('Deployment ID is required');
    }
    
    if (!this.config.genesys.environment && !this.config.genesys.domain) {
      throw new Error('Either environment or domain must be provided');
    }
    
    if (!this.config.scriptUrl) {
      throw new Error('Script URL is required');
    }
    
    return true;
  }

  /**
   * Get the current configuration
   * @returns {Object} - The configuration object
   */
  getConfig() {
    return this.config;
  }
}
const loadDefaultConfigs = () => {
  const params = new URLSearchParams(window.location.search);
  const env = params.get('env') || 'prod';
  const baseConfigs = {
      videoEngager: {
        tenantId: '',
        veEnv: '',
        veHttps: true
      },
      genesys: {
        deploymentId: '',
        environment: '',
        domain: ''
      },
      useGenesysMessengerChat: true,
      scriptUrl: 'https://cdn.videoengager.com/widget/latest/browser/genesys-hub.umd.js'
    };
    console.log('env', env);
  switch (env) {
    case 'prod':
      baseConfigs.videoEngager.veEnv = 'videome.leadsecure.com';
      baseConfigs.genesys.domain = 'mypurecloud.com';
      break;
    case 'staging':
      baseConfigs.videoEngager.veEnv = 'staging.leadsecure.com';
      baseConfigs.genesys.domain = 'mypurecloud.de';
      break;
    case 'dev':
      baseConfigs.videoEngager.veEnv = 'dev.videoengager.com';
      baseConfigs.genesys.domain = 'mypurecloud.com.au';
      baseConfigs.videoEngager.tenantId = 'test_tenant';
      baseConfigs.genesys.deploymentId = '240e55e7-3dc1-4e23-8755-58aabab9dfb6';
      baseConfigs.scriptUrl = 'js/genesys-hub.umd.js';
      baseConfigs.logger = { level: 4 };
      break;
    default:
      break;
  }
  return baseConfigs;
}
// Export singleton instance
const configManager = new ConfigManager();