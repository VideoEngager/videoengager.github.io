
const veConfigs = {
  dev: {
    // VideoEngager settings
    tenantId: 'test_tenant',
    veEnv: 'dev.videoengager.com',
    veHttps: true,

    // Genesys settings
    environment: 'prod-apse2',
    deploymentId: '240e55e7-3dc1-4e23-8755-58aabab9dfb6',
    debug: true
  },
  prod: {
    // VideoEngager settings
    tenantId: '0FphTk091nt7G1W7',
    veEnv: 'videome.leadsecure.com',
    veHttps: true,

    // Genesys settings
    environment: 'prod',
    deploymentId: 'c5d801ae-639d-4e5e-a52f-4963342fa0dc',
    debug: true
  },
  'prod-staging': {
    // VideoEngager settings
    tenantId: 'QcXz1VNDYAtXe4jc',
    veEnv: 'staging.leadsecure.com',
    veHttps: true,

    // Genesys settings
    environment: 'prod',
    deploymentId: 'c5d801ae-639d-4e5e-a52f-4963342fa0dc',
    debug: true
  },
  'prod-dev': {
    // VideoEngager settings
    tenantId: 'test_tenant',
    veEnv: 'dev.videoengager.com',
    veHttps: true,

    // Genesys settings
    environment: 'prod',
    deploymentId: 'c5d801ae-639d-4e5e-a52f-4963342fa0dc',
    debug: true
  },
  staging: {
    // VideoEngager settings
    tenantId: 'oIiTR2XQIkb7p0ub',
    veEnv: 'staging.leadsecure.com',
    veHttps: true,

    // Genesys settings
    environment: 'prod-euc1',
    deploymentId: '50bce9ca-111b-4372-87ff-5f98ae8849e6',
    debug: true
  }
};

/**
 * Parse configuration from URL query parameters
 */
function parseConfig () {
  const urlParams = new URLSearchParams(window.location.search);
  const env = urlParams.get('env') || 'dev';
  const predefinedConfig = veConfigs[env] || {};
  // Default configuration
  const configs = {
    ...predefinedConfig,
    // VideoEngager settings
    tenantId: predefinedConfig.tenantId || 'test_tenant',
    veEnv: predefinedConfig.veEnv || 'dev.videoengager.com',
    veHttps: predefinedConfig.veHttps !== undefined ? predefinedConfig.veHttps : true,

    // Genesys settings
    environment: predefinedConfig.environment || 'prod-apse2',
    deploymentId: predefinedConfig.deploymentId || '240e55e7-3dc1-4e23-8755-58aabab9dfb6',

    // Custom attributes
    customerName: predefinedConfig.customerName || 'John Doe',
    customerEmail: predefinedConfig.customerEmail || 'john.doe@example.com',
    department: predefinedConfig.department || 'support',

    debug: predefinedConfig.debug !== undefined ? predefinedConfig.debug : true
  };
  for (const configsKey in configs) {
    const paramValue = urlParams.get(configsKey);
    if (paramValue === 'true' || paramValue === 'false') {
      configs[configsKey] = paramValue === 'true';
    } else if (paramValue) {
      configs[configsKey] = paramValue;
    }
  }
  return configs;
}
window.parseConfig = parseConfig;
