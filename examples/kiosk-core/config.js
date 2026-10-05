(function () {
  // Public demo settings only. Never put client secrets or tokens in a kiosk URL.
  // Genesys loads a script from this host, so trust only the SDK's region mapping.
  const genesysDomains = [...new Set(Object.values(window.VideoEngager?.gensysPureDomainsMapping || {}))];
  const presets = {
    dev: {
      videoEngager: { veEnv: 'dev.videoengager.com', tenantId: 'test_tenant' },
      genesys: { domain: 'mypurecloud.com.au', deploymentId: '0928a947-d4bd-4524-9fc3-d98cb7938a83' }
    },
    staging: {
      videoEngager: { veEnv: 'staging.videoengager.com', tenantId: 'oIiTR2XQIkb7p0ub' },
      genesys: { domain: 'mypurecloud.de', deploymentId: 'ce6ed541-29fd-42ad-8fda-c245f683d43a' }
    },
    production: {
      videoEngager: { veEnv: 'videome.leadsecure.com', tenantId: '0FphTk091nt7G1W7' },
      genesys: { domain: 'mypurecloud.com', deploymentId: 'c5d801ae-639d-4e5e-a52f-4963342fa0dc' },
      authenticatedDeploymentId: 'c7387131-f85e-478e-b2f2-14e4a5ec9dbb'
    },
    uae: {
      videoEngager: { veEnv: 'uae.leadsecure.com', tenantId: 'tjgaLJugv7IgWfiL' },
      genesys: { domain: 'mypurecloud.ie', deploymentId: '2bda922a-8386-4c23-b28d-cae56cd68689' }
    }
  };
  const defaults = {
    auth: {
      enabled: false,
      mode: 'perInteraction',
      authorizationEndpoint: 'https://integrator-6759517.okta.com/oauth2/v1/authorize',
      clientId: '0oa15o173k3Po5MRM698',
      scopes: ['openid', 'profile', 'email']
    },
    kioskId: 'demo-kiosk-01',
    maxWaitMs: 180000,
    endTimeoutMs: 10000,
    waitingScreen: true,
    waitingScreenMode: 'overlay',
    chatMode: 'hidden',
    chatMinimized: false,
    postCallSurvey: false,
    surveyTimeoutMs: 60000,
    cleanupOnUnload: true
  };

  function validate (config) {
    if (!genesysDomains.length) throw new Error('The VideoEngager SDK\'s Genesys region list did not load. Check your connection and reload.');
    if (!config || !Object.hasOwn(presets, config.environment)) throw new Error('Choose a valid environment: dev, staging, production or uae.');
    const hostname = /^(?=.{1,253}$)(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i;
    if (!hostname.test(config.videoEngager?.veEnv)) {
      throw new Error('Enter the VideoEngager hostname without https://, ports or paths.');
    }
    if (!genesysDomains.includes(config.genesys?.domain)) {
      throw new Error('Choose a Genesys hostname supported by the loaded VideoEngager SDK.');
    }
    if (typeof config.videoEngager.tenantId !== 'string' || !/^[\w-]{1,128}$/.test(config.videoEngager.tenantId)) {
      throw new Error('Enter a valid VideoEngager tenant ID (letters, numbers, underscores or hyphens).');
    }
    if (!/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(config.genesys.deploymentId)) {
      throw new Error('Enter a valid Genesys deployment ID. For authentication, supply an authenticated deployment.');
    }
    if (typeof config.kioskId !== 'string' || !config.kioskId.trim() || config.kioskId.length > 100 || /[\x00-\x1f\x7f]/.test(config.kioskId)) {
      throw new Error('Enter a kiosk ID between 1 and 100 characters.');
    }
    for (const [name, value] of Object.entries({ auth: config.auth?.enabled, waitingScreen: config.waitingScreen, chatMinimized: config.chatMinimized, postCallSurvey: config.postCallSurvey, cleanupOnUnload: config.cleanupOnUnload })) {
      if (typeof value !== 'boolean') throw new Error(`${name} must be true or false.`);
    }
    if (!['shared', 'perInteraction'].includes(config.auth.mode)) throw new Error('authMode must be shared or perInteraction.');
    if (!['overlay', 'beside'].includes(config.waitingScreenMode)) throw new Error('waitingScreenMode must be overlay or beside.');
    if (!['hidden', 'onActivity', 'always', 'afterStart'].includes(config.chatMode)) throw new Error('chatMode must be hidden, onActivity, always or afterStart.');
    for (const [name, min, max] of [['maxWaitMs', 1000, 3600000], ['endTimeoutMs', 1000, 60000], ['surveyTimeoutMs', 5000, 3600000]]) {
      if (!Number.isInteger(config[name]) || config[name] < min || config[name] > max) throw new Error(`${name} must be a whole number between ${min} and ${max} milliseconds.`);
    }
    let endpoint;
    try { endpoint = new URL(config.auth.authorizationEndpoint); } catch { /* Use the readable error below. */ }
    if (!endpoint || endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
      throw new Error('Use an HTTPS authorization endpoint without credentials, query parameters or a fragment.');
    }
    if (typeof config.auth.clientId !== 'string' || !config.auth.clientId.trim() || config.auth.clientId.length > 256 || /\s/.test(config.auth.clientId)) {
      throw new Error('Enter the public OIDC client ID. Do not enter a client secret.');
    }
    if (!Array.isArray(config.auth.scopes) || !config.auth.scopes.includes('openid') || config.auth.scopes.some(scope => typeof scope !== 'string' || !/^[\x21\x23-\x5b\x5d-\x7e]+$/.test(scope))) {
      throw new Error('Enter space-separated OIDC scopes, including openid.');
    }
    return config;
  }

  function read (search = '') {
    const query = new URLSearchParams(search);
    function value (name, fallback) {
      if (query.getAll(name).length > 1) throw new Error(`Provide ${name} only once.`);
      return query.has(name) ? query.get(name).trim() : fallback;
    }
    function boolean (name, fallback) {
      const result = value(name, String(fallback));
      if (result !== 'true' && result !== 'false') throw new Error(`${name} must be true or false.`);
      return result === 'true';
    }
    function milliseconds (name) {
      const result = value(name, String(defaults[name]));
      if (!/^\d+$/.test(result)) throw new Error(`${name} must be a whole number of milliseconds.`);
      return Number(result);
    }
    const environment = value('env', 'production');
    if (!Object.hasOwn(presets, environment)) throw new Error('Choose a valid environment: dev, staging, production or uae.');
    const preset = presets[environment];
    const authenticated = boolean('auth', defaults.auth.enabled);
    return validate({
      environment,
      videoEngager: {
        veEnv: value('veDomain', preset.videoEngager.veEnv),
        tenantId: value('veTenantId', preset.videoEngager.tenantId)
      },
      genesys: {
        domain: value('genesysDomain', preset.genesys.domain).toLowerCase(),
        deploymentId: value('genesysDeploymentId', authenticated ? (preset.authenticatedDeploymentId || '') : preset.genesys.deploymentId)
      },
      auth: {
        enabled: authenticated,
        mode: value('authMode', defaults.auth.mode),
        authorizationEndpoint: value('authorizationEndpoint', defaults.auth.authorizationEndpoint),
        clientId: value('clientId', defaults.auth.clientId),
        scopes: value('scopes', defaults.auth.scopes.join(' ')).split(/\s+/)
      },
      kioskId: value('kioskId', defaults.kioskId),
      maxWaitMs: milliseconds('maxWaitMs'),
      endTimeoutMs: milliseconds('endTimeoutMs'),
      waitingScreen: boolean('waitingScreen', defaults.waitingScreen),
      waitingScreenMode: value('waitingScreenMode', defaults.waitingScreenMode),
      chatMode: value('chatMode', defaults.chatMode),
      chatMinimized: boolean('chatMinimized', defaults.chatMinimized),
      postCallSurvey: boolean('postCallSurvey', defaults.postCallSurvey),
      surveyTimeoutMs: milliseconds('surveyTimeoutMs'),
      cleanupOnUnload: boolean('cleanupOnUnload', defaults.cleanupOnUnload)
    });
  }

  function toSearch (config) {
    validate(config);
    return new URLSearchParams({
      env: config.environment,
      veDomain: config.videoEngager.veEnv,
      veTenantId: config.videoEngager.tenantId,
      genesysDomain: config.genesys.domain,
      genesysDeploymentId: config.genesys.deploymentId,
      auth: config.auth.enabled,
      authMode: config.auth.mode,
      authorizationEndpoint: config.auth.authorizationEndpoint,
      clientId: config.auth.clientId,
      scopes: config.auth.scopes.join(' '),
      kioskId: config.kioskId,
      maxWaitMs: config.maxWaitMs,
      endTimeoutMs: config.endTimeoutMs,
      waitingScreen: config.waitingScreen,
      waitingScreenMode: config.waitingScreenMode,
      chatMode: config.chatMode,
      chatMinimized: config.chatMinimized,
      postCallSurvey: config.postCallSurvey,
      surveyTimeoutMs: config.surveyTimeoutMs,
      cleanupOnUnload: config.cleanupOnUnload
    }).toString();
  }

  window.KioskConfig = { presets, genesysDomains, read, validate, toSearch };
  try {
    if (window.KIOSK_AUTH_ERROR) throw new Error(window.KIOSK_AUTH_ERROR);
    const query = new URLSearchParams(window.location.search);
    if (query.has('code') || query.has('error')) {
      // auth.js must process kiosk callbacks first; the configurator never accepts one.
      throw new Error('The sign-in callback was not processed. Open the configurator to sign in again.');
    }
    window.KIOSK_CONFIG = read(window.location.search);
  } catch (error) {
    window.KIOSK_CONFIG_ERROR = error.message || 'The kiosk configuration is invalid.';
  }
}());
