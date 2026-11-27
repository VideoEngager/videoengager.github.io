/* config.js — page settings for index.html (multilingual example). Not part of the SDK integration.
 *
 * Builds window.DEMO_CONFIG (the object index.html hands to the SDK) from the
 * page URL. The URL is the configuration; nothing is stored anywhere.
 *
 * Two valid forms:
 *   1. Explicit settings — all four are mandatory:
 *        ?veEnv=…&tenantId=…&domain=…&deploymentId=…
 *      optional: &mode=messenger|pure-socket  &hideMessengerUi=true|false  &debug=true|false
 *                &locale=<two-letter code from locales.js, e.g. bg>
 *      configurator.html produces this form.
 *   2. A public demo tenant:  ?env=production | uae | staging | dev
 *      (used by the examples index). Cannot be combined with explicit settings,
 *      but &locale=… may be added (e.g. ?env=staging&locale=bg).
 *
 * Public values only — a VideoEngager tenant ID and a Messenger deployment ID
 * are public by design. Never put a PAK, an OAuth secret or a token in a URL.
 */
(function () {
  // VideoEngager service hosts. 'other' in the configurator allows any hostname.
  const veHosts = [
    { value: 'videome.leadsecure.com',  label: 'Production — US' },
    { value: 'videome.videoengager.eu', label: 'Production — EU' },
    { value: 'uae.leadsecure.com',      label: 'Production — UAE' },
    { value: 'staging.leadsecure.com',  label: 'Staging' },
    { value: 'dev.videoengager.com',    label: 'Development' }
  ];
  // Genesys region hosts the loaded SDK supports (empty if the SDK has not loaded).
  const genesysDomains = [...new Set(Object.values(window.VideoEngager?.gensysPureDomainsMapping || {}))];
  // Initial selection in the configurator.
  const initial = { veEnv: 'videome.leadsecure.com', domain: 'mypurecloud.com', mode: 'messenger', hideMessengerUi: true, debug: false, locale: '' };
  // Visitor UI languages: generated from the localization CSV into locales.js (load it before this file).
  const locales = window.VE_LOCALES || [];
  // VideoEngager's public demo tenants + demo Messenger deployments, reachable only via ?env=…
  const demoTenants = {
    production: { veEnv: 'videome.leadsecure.com',  tenantId: '0FphTk091nt7G1W7', domain: 'mypurecloud.com',    deploymentId: 'c5d801ae-639d-4e5e-a52f-4963342fa0dc' },
    uae:        { veEnv: 'uae.leadsecure.com',      tenantId: 'tjgaLJugv7IgWfiL', domain: 'mypurecloud.ie',     deploymentId: '2bda922a-8386-4c23-b28d-cae56cd68689' },
    staging:    { veEnv: 'staging.leadsecure.com',  tenantId: 'oIiTR2XQIkb7p0ub', domain: 'mypurecloud.de',     deploymentId: 'ce6ed541-29fd-42ad-8fda-c245f683d43a' },
    dev:        { veEnv: 'dev.videoengager.com',    tenantId: 'test_tenant',      domain: 'mypurecloud.com.au', deploymentId: '866736cb-f3a5-47a1-a3af-8316fe143a29' }
  };
  const REQUIRED = ['veEnv', 'tenantId', 'domain', 'deploymentId'];

  function read (search) {
    const q = new URLSearchParams(search);
    const env = q.get('env');
    const explicit = REQUIRED.filter((k) => q.has(k));
    let s;
    if (env !== null) {
      if (!Object.hasOwn(demoTenants, env)) throw new Error(`Unknown env "${env}". Public demo tenants: ${Object.keys(demoTenants).join(', ')}.`);
      if (explicit.length) throw new Error('Use either env=<demo tenant> or explicit settings, not both.');
      s = { env, ...demoTenants[env] };
    } else {
      if (!explicit.length) throw new Error('Not configured.');
      s = { env: null };
      for (const k of REQUIRED) s[k] = (q.get(k) || '').trim();
    }
    const b = (k) => q.has(k) ? q.get(k) === 'true' : initial[k];
    s.mode = q.get('mode') === 'pure-socket' ? 'pure-socket' : 'messenger';
    s.hideMessengerUi = b('hideMessengerUi'); s.debug = b('debug');
    s.locale = (q.get('locale') || '').trim().toLowerCase();
    return validate(s);
  }
  function validate (s) {
    if (!s.veEnv) throw new Error('Choose your VideoEngager host.');
    if (!/^(?=.{1,253}$)(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(s.veEnv)) throw new Error('VideoEngager host: hostname only, no https:// or path.');
    if (!s.tenantId) throw new Error('Enter your VideoEngager tenant ID (Genesys Cloud → SmartVideo Settings → SmartVideo).');
    if (!/^[\w-]{1,128}$/.test(s.tenantId)) throw new Error('Tenant ID: letters, digits, _ or - only.');
    if (!s.domain) throw new Error('Choose your Genesys Cloud region host.');
    if (genesysDomains.length && !genesysDomains.includes(s.domain)) throw new Error('Genesys region host must be one the loaded SDK supports.');
    if (!s.deploymentId) throw new Error('Enter your Messenger deployment ID (Genesys Cloud → Admin → Message → Messenger Deployments).');
    if (!/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(s.deploymentId)) throw new Error('Messenger deployment ID must be a GUID.');
    if (s.locale && !locales.some((l) => l.code === s.locale)) throw new Error(`Unknown language "${s.locale}". Available: ${locales.map((l) => l.code).join(', ')}.`);
    return s;
  }
  // Settings → URL query (explicit form; never env).
  function toSearch (s) {
    const q = new URLSearchParams({ veEnv: s.veEnv, tenantId: s.tenantId, domain: s.domain, deploymentId: s.deploymentId, mode: s.mode, hideMessengerUi: String(s.hideMessengerUi), debug: String(s.debug) });
    if (s.locale) q.set('locale', s.locale);
    return q.toString();
  }
  // Settings → the object the SDK constructors take (same shape as CONFIG in index.html).
  function toSdkConfig (s) {
    return {
      videoEngager: { veEnv: s.veEnv, tenantId: s.tenantId, enableVeIframeCommands: true, veHttps: true, debug: s.debug },
      genesys: { domain: s.domain, deploymentId: s.deploymentId, enableVideoEngagerRestoringSession: true, debug: s.debug },
      genesysIntegration: s.mode,          // 'messenger' (deployment auto-start OFF) | 'pure-socket' (auto-start ON)
      hideMessengerUi: s.hideMessengerUi,  // page behaviour
      locale: s.locale || null             // page behaviour: preselected visitor UI language (null = browser language)
    };
  }
  // Settings → the literal to paste into an application.
  function toSdkLiteral (s) {
    const c = toSdkConfig(s);
    const j = (v) => JSON.stringify(v);
    return [
      'const CONFIG = {',
      `  videoEngager: { veEnv: ${j(c.videoEngager.veEnv)}, tenantId: ${j(c.videoEngager.tenantId)}, enableVeIframeCommands: true, veHttps: true, debug: ${c.videoEngager.debug} },`,
      `  genesys: { domain: ${j(c.genesys.domain)}, deploymentId: ${j(c.genesys.deploymentId)}, enableVideoEngagerRestoringSession: true, debug: ${c.genesys.debug} },`,
      `  genesysIntegration: ${j(c.genesysIntegration)},   // 'messenger' | 'pure-socket'`,
      `  hideMessengerUi: ${c.hideMessengerUi}`,
      '};'
    ].join('\n');
  }

  window.DemoConfig = { veHosts, genesysDomains, initial, demoTenants, locales, read, validate, toSearch, toSdkConfig, toSdkLiteral };
  try {
    window.DEMO_SETTINGS = read(window.location.search);
    window.DEMO_CONFIG = toSdkConfig(window.DEMO_SETTINGS);
  } catch (error) {
    window.DEMO_CONFIG_ERROR = error.message;
  }
}());
