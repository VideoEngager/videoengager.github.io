// Run: node examples/kiosk-core/check.cjs (no browser, network, or dependencies).
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const { EventEmitter } = require('node:events');
const { webcrypto, createHash } = require('node:crypto');
const source = name => readFileSync(join(__dirname, name), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
// SDK export fixture; runtime hosts come from main.umd.js, never this test data.
const genesysDomains = { prod: 'mypurecloud.com', apse2: 'mypurecloud.com.au', euc1: 'mypurecloud.de', euw1: 'mypurecloud.ie', euw2: 'euw2.pure.cloud', dev: 'inindca.com', test: 'inindca.com' };

function readConfig(search = '', storage = new Map(), loadAuth = true, domainMapping = genesysDomains) {
  const window = {
    VideoEngager: { gensysPureDomainsMapping: domainMapping },
    isSecureContext: true, crypto: webcrypto,
    location: { search, origin: 'https://kiosk.example', pathname: '/demo/index.html' },
    sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    history: { replaceState(_state, _title, url) { window.location.search = new URL(url, window.location.origin).search; } }
  };
  const context = { window, URL, URLSearchParams, TextEncoder, btoa, console, document: { title: 'Kiosk' } };
  if (loadAuth) runInNewContext(source('auth.js'), context);
  runInNewContext(source('config.js'), context);
  return window;
}

async function kiosk(options = {}) {
  const elements = new Map(), timers = new Map(), events = new EventEmitter(), motionEvents = new EventEmitter();
  const markup = source('index.html');
  const fake = { starts: 0, videoEnds: 0, conversationEnds: 0, coreClearCalls: 0, clearCalls: 0, immediateEnds: 0, hangups: 0, reloads: 0, destroyCalls: 0, authCalls: 0, logouts: 0, authCancels: 0, redirects: 0, animations: [], ...options };
  fake.navigations = [];
  fake.videoEndArgs = []; fake.integrationEndErrors = [];
  fake.chatCommands = []; fake.pendingChatCommands = 0; fake.sdkOperations = 0; fake.warnings = []; fake.overlaps = [];
  const requireIdle = (pending, message) => { if (pending) fake.overlaps.push(message); assert.equal(pending, 0, message); };
  fake.motion = { matches: !!options.reducedMotion, addEventListener: motionEvents.on.bind(motionEvents) };
  fake.setReducedMotion = value => { fake.motion.matches = value; motionEvents.emit('change'); };
  function element() {
    const classes = new Set(), listeners = new EventEmitter(), selectors = new Map(), attributes = new Map();
    return {
      hidden: false, disabled: false, textContent: '', children: [], contentWindow: {},
      classList: {
        add: name => classes.add(name), remove: name => classes.delete(name),
        toggle(name, value) { value ? classes.add(name) : classes.delete(name); }, contains: name => classes.has(name)
      },
      addEventListener: listeners.on.bind(listeners),
      dispatch: listeners.emit.bind(listeners),
      setAttribute: attributes.set.bind(attributes), getAttribute: attributes.get.bind(attributes),
      append(child) { this.children.push(child); },
      replaceChildren() { this.children = []; },
      querySelector(selector) {
        if (selector === 'iframe') return this.children[0] || null;
        assert.ok(markup.includes(selector.slice(1, -1)), `Markup contains ${selector}`);
        if (!selectors.has(selector)) selectors.set(selector, element());
        return selectors.get(selector);
      },
      querySelectorAll(selector) {
        assert.equal(selector, '[data-waiting-slide]');
        if (!selectors.has(selector)) selectors.set(selector, Array.from(markup.matchAll(/\bdata-waiting-slide\b/g), () => element()));
        return selectors.get(selector);
      },
      getBoundingClientRect() { return document.body.classList.contains('call-active') ? { left: 0, top: 0, width: 1200, height: 900 } : { left: 80, top: 120, width: 800, height: 600 }; },
      animate(frames, options) {
        const animation = { frames, options, cancelled: false, cancel() { this.cancelled = true; } };
        fake.animations.push(animation); return animation;
      },
      contains(node) { return this === node || [...this.children, ...selectors.values()].flat().some(child => child.contains(node)); },
      matches(selector) { assert.equal(selector, ':focus-visible'); return !!this.focusVisible; },
      focus() { document.activeElement = this; }, click() { if (!this.disabled) listeners.emit('click'); }
    };
  }
  const document = {
    body: element(),
    getElementById(id) {
      if (!elements.has(id)) {
        const attributes = markup.match(new RegExp(`<[^>]+id="${id}"[^>]*>`))?.[0];
        assert.ok(attributes, `Markup contains #${id}`);
        elements.set(id, { ...element(), disabled: /\bdisabled\b/.test(attributes), hidden: /\bhidden\b/.test(attributes) });
      }
      return elements.get(id);
    },
    createElement: element
  };
  class Core extends EventEmitter {
    constructor(config) { super(); fake.core = this; fake.coreConfig = config; this.contactCenterInActiveInteraction = !!fake.restored; this.isCallOngoing = false; this.callState = 'idle'; }
    setCallState(state) {
      if (this.callState === state) return;
      this.callState = state; this.emit('videoEngager:call-state-changed', state);
    }
    setInstanceActive(active) {
      if (this.isCallOngoing === active) return;
      this.isCallOngoing = active; this.emit('videoEngager:active-ve-instance', active);
    }
    callStarted() { this.emit('videoEngager:CallStarted'); this.setCallState('active'); }
    callEnded(emitLegacy = true) { if (emitLegacy) this.emit('videoEngager:CallEnded'); this.setCallState('ended'); }
    popupClosed() { this.emit('videoEngager:PopupClosed'); this.closeVideo(true); }
    setUiCallbacks(callbacks) { this.ui = callbacks; }
    async setContactCenterIntegration(integration) {
      fake.integration = integration;
      await fake.integrationGate?.promise;
      if (integration.config.authProvider && !fake.savedAuth) await integration.config.authProvider.getAuthCode();
      fake.beforeIntegrationReady?.(this, fake);
    }
    startVideoEngagerInteraction(args) {
      fake.starts++; fake.startArgs = args;
      this.startOperation = (async () => {
        await fake.startGate?.promise;
        if (fake.failStart) throw Error('Start failed');
        this.contactCenterInActiveInteraction = true;
        this.emit('integration:sessionStarted');
        if (fake.failStartAfterSession) throw Error('Video startup failed after session creation');
        this.ui.createIframe('https://example.test/call');
        this.setInstanceActive(true);
        this.ui.setIframeVisibility(true);
        await fake.handshakeGate?.promise;
      })();
      return this.startOperation;
    }
    closeVideo(force = false) {
      if (!this.isCallOngoing && !force) return;
      this.ui.destroyIframe();
      this.setCallState('idle');
      this.setInstanceActive(false);
      this.emit('videoEngager:videoSessionEnd');
      this.ui.setIframeVisibility(false);
    }
    async endVideoEngagerInteraction(endContactCenter) {
      fake.videoEnds++; fake.videoEndArgs.push(endContactCenter);
      assert.equal(endContactCenter, true, 'The kiosk always asks the video-end API to end Genesys too');
      // Core's PromiseManager waits with allSettled, so a rejected start also releases this end request.
      await Promise.allSettled([this.startOperation]);
      if (fake.failVideoEnd) throw Error('Video cleanup failed');
      this.closeVideo(true);
      try {
        if (!this.contactCenterInActiveInteraction) throw Error('No active conversation');
        fake.coreClearCalls++;
        await fake.endGate?.promise;
        if (fake.failConversationEnd) throw Error('Messenger cleanup failed');
        if (!fake.delayedEnd) fake.sessionEnded();
      } catch (error) {
        // Current Core logs integration-end failures without rejecting endVideoEngagerInteraction.
        fake.integrationEndErrors.push(error.message);
      }
    }
    endContactCenterInteraction() {
      fake.conversationEnds++;
      assert.fail('The kiosk must use endVideoEngagerInteraction(true), not the public contact-center end API');
    }
    async executeVideoCallFn(name) {
      assert.equal(name, 'triggerHangup'); fake.hangups++;
      await fake.hangupGate?.promise;
      if (!fake.delayedHangup) this.popupClosed();
    }
    _expiremental_immedieteEndContactCenterInteraction() { fake.immediateEnds++; }
    async destroyInstance() {
      fake.destroyCalls++;
      await fake.destroyGate?.promise;
    }
  }
  for (const name of ['setContactCenterIntegration', 'startVideoEngagerInteraction', 'endVideoEngagerInteraction', 'endContactCenterInteraction', 'executeVideoCallFn']) {
    const original = Core.prototype[name];
    Core.prototype[name] = async function (...args) {
      requireIdle(fake.pendingChatCommands, `${name} waits for pending Messenger UI commands`);
      fake.sdkOperations++;
      try { return await original.apply(this, args); } finally { fake.sdkOperations--; }
    };
  }
  const window = {
    ...readConfig(options.search, options.storage), isSecureContext: true, addEventListener: events.on.bind(events),
    matchMedia: () => fake.motion,
    VideoEngager: { VideoEngagerCore: Core, GenesysIntegration: class { constructor(config) { this.config = config; this.genesysJsSdkWrapper = {}; } } },
    Genesys(type, command, data, resolve, reject) {
      assert.equal(type, 'command', 'The kiosk uses Core events instead of subscribing to Genesys directly');
      if (command === 'Messenger.open' || command === 'Messenger.close') {
        requireIdle(fake.sdkOperations, 'Messenger UI commands wait for Core operations');
        fake.chatCommands.push(command); fake.pendingChatCommands++;
        void Promise.resolve(fake.chatGate?.promise).then(() => {
          fake.pendingChatCommands--;
          if (fake.chatError) { reject(fake.chatError); return; }
          fake.chatOpen = command === 'Messenger.open'; resolve();
        });
        return;
      }
      requireIdle(fake.pendingChatCommands, `${command} waits for pending Messenger UI commands`);
      if (command === 'MessagingService.clearConversation') {
        fake.clearCalls++;
        assert.fail('The kiosk must not bypass Core with a direct Messenger clear');
      }
      assert.equal(command, 'Auth.logout'); fake.logouts++;
      if (fake.failLogout) { reject(Error('Logout failed')); return; }
      if (fake.logoutGate) { void fake.logoutGate.promise.then(resolve); return; }
      if (!fake.stuckLogout) resolve();
      if (!fake.delayedLogout && !fake.stuckLogout) fake.loggedOut();
    },
    createKioskAuthProvider(config) {
      fake.authCalls++; fake.authConfig = config;
      return fake.authProvider = {
        grantConsumed: false, startAfterLogin: !!fake.startAfterLogin, isRedirecting: false, cancelled: false,
        async getAuthCode() {
          assert.equal(config.shouldStartAfterLogin(), true, 'Authentication belongs to a requested call');
          await fake.authGate?.promise;
          if (this.cancelled) throw Error('Cancelled');
          if (fake.redirectOnAuth) return this.reAuthenticate();
          this.grantConsumed = true; return { authCode: 'fresh-grant' };
        },
        reAuthenticate() { fake.redirects++; this.isRedirecting = true; return new Promise(() => {}); },
        cancel() { fake.authCancels++; this.cancelled = true; }
      };
    }
  };
  window.location.reload = () => {
    fake.reloads++;
    events.emit('beforeunload'); events.emit('pagehide');
  };
  window.location.assign = url => fake.navigations.push(url);
  if (options.config) Object.assign(window.KIOSK_CONFIG, options.config);
  if (options.authenticated) window.KIOSK_CONFIG.auth.enabled = true;
  if (options.authMode) window.KIOSK_CONFIG.auth.mode = options.authMode;
  fake.config = window.KIOSK_CONFIG;
  fake.body = document.body;
  fake.focusedElement = () => document.activeElement;
  fake.ui = Object.fromEntries(['status', 'start', 'end', 'survey-done', 'retry', 'waiting', 'video-container', 'error'].map(id => [id, document.getElementById(id)]));
  fake.sessionEnded = () => {
    fake.core.contactCenterInActiveInteraction = false;
    // Core registers its integration listener before app.js and closes video first.
    fake.core.closeVideo();
    fake.core.emit('integration:sessionEnded');
  };
  fake.loggedOut = () => fake.core.emit('error:catchAll', { context: { authEvent: 'Auth.loggedOut' } });
  fake.dispatch = (name, payload) => events.emit(name, payload);
  fake.fireTimer = key => {
    const timer = [...timers].find(([, value]) => value.ms === (typeof key === 'number' ? key : fake.config[key]));
    assert.ok(timer, `Scheduled ${key}`); timers.delete(timer[0]); timer[1].callback();
  };
  fake.timers = timers;
  const context = {
    window, document, navigator: { onLine: true }, AbortController, URL, console: { ...console, warn: (...args) => fake.warnings.push(args) },
    setTimeout(callback, ms) { const id = Symbol(); timers.set(id, { callback, ms }); return id; },
    clearTimeout(id) { timers.delete(id); }
  };
  for (const name of ['waiting-screen.js', 'ui.js', 'chat-ui.js', 'app.js']) runInNewContext(source(name), context);
  await flush();
  fake.start = async () => { fake.ui.start.click(); await flush(); };
  fake.end = async () => { fake.ui.end.click(); await flush(); };
  return fake;
}

const ready = fake => {
  assert.equal(fake.conversationEnds, 0, 'The kiosk never calls the public contact-center end API');
  assert.equal(fake.clearCalls, 0, 'The kiosk never calls Messenger clearConversation directly');
  assert.equal(fake.ui.start.disabled, false, 'Kiosk can start a fresh visitor');
  assert.equal(fake.ui.end.disabled, true, 'Welcome has no session to end');
  assert.equal(fake.body.classList.contains('call-active'), false, 'Welcome restores the normal layout');
  assert.equal(fake.body.classList.contains('waiting-overlay'), false, 'Welcome does not retain a waiting overlay');
};
const failed = fake => {
  assert.equal(fake.conversationEnds, 0); assert.equal(fake.clearCalls, 0);
  assert.equal(fake.ui.error.hidden, false);
  assert.equal(fake.ui.start.disabled, true, 'Unconfirmed cleanup cannot admit another visitor');
  assert.equal(fake.ui.end.disabled, true, 'Failure does not enable End/Cancel');
  assert.equal(fake.ui['video-container'].children.length, 0);
  assert.equal(fake.body.classList.contains('call-active'), false, 'Errors restore the normal layout');
  assert.equal(fake.body.classList.contains('waiting-overlay'), false, 'Errors do not retain a waiting overlay');
};

async function checkKiosk() {
  const basic = await kiosk(); ready(basic); assert.equal(basic.authCalls, 0);
  await basic.start(); await basic.end();
  assert.equal(basic.videoEnds, 1); assert.deepEqual(basic.videoEndArgs, [true]);
  assert.equal(basic.coreClearCalls, 1, 'One video-end request owns video closure and the active Genesys end attempt'); ready(basic);
  await basic.start(); basic.fireTimer('maxWaitMs'); await flush();
  ready(basic); assert.equal(basic.starts, 2); assert.equal(basic.videoEnds, 2);
  assert.match(basic.ui.status.textContent, /No agent connected/);
  for (const expire of [false, true]) {
    const pending = await kiosk({ startGate: deferred(), endGate: deferred(), destroyGate: deferred() });
    pending.ui.start.click(); pending.ui.start.click(); await flush();
    assert.equal(pending.starts, 1, 'Double start is blocked');
    assert.equal(pending.startArgs.bindToOrStartContactCenterInteraction, true); assert.equal(pending.startArgs.callConfigs.isPopup, false);
    assert.equal(pending.ui.end.disabled, true);
    await pending.end();
    assert.equal(pending.videoEnds, 0, 'An early Cancel click cannot submit an end while startup is pending');
    pending.fireTimer('maxWaitMs'); await flush();
    assert.equal(pending.videoEnds, 1, 'The automatic wait deadline can still submit Core end during startup');
    assert.equal(pending.coreClearCalls, 0, 'Core owns waiting behind startup before clearing Genesys');
    pending.core.emit('integration:sessionStarted'); await pending.end();
    assert.equal(pending.videoEnds, 1, 'Duplicate end/session events cannot submit another Core end');
    if (expire) { pending.fireTimer('endTimeoutMs'); await flush(); failed(pending); }
    pending.startGate.resolve(); await flush();
    assert.equal(pending.coreClearCalls, 1, 'The queued Core end continues after startup settles, even after the UI deadline');
    assert.equal(pending.ui['video-container'].hidden, true, 'Cancelled startup never exposes a late iframe');
    pending.endGate.resolve(); await flush();
    assert.equal(pending.ui['video-container'].children.length, 0, 'Core cleanup removes the cancelled iframe');
    assert.equal(pending.immediateEnds, 0, 'The queued end needs no duplicate emergency or late-session clear');
    assert.equal(pending.clearCalls, 0, 'Queued Core cleanup does not add a separate Messenger clear');
    if (expire) {
      failed(pending);
      pending.core.callStarted(); failed(pending);
      pending.ui.retry.click(); assert.equal(pending.reloads, 1, 'Reload does not await stuck teardown');
    } else { ready(pending); assert.equal(pending.videoEnds, 1); }
  }
  for (const failure of ['failStart', 'failStartAfterSession']) {
    const rejectedStart = await kiosk({ startGate: deferred(), [failure]: true });
    await rejectedStart.start(); await rejectedStart.end();
    assert.equal(rejectedStart.ui.end.disabled, true); assert.equal(rejectedStart.videoEnds, 0);
    rejectedStart.fireTimer('maxWaitMs'); await flush();
    assert.equal(rejectedStart.videoEnds, 1); assert.equal(rejectedStart.coreClearCalls, 0);
    rejectedStart.startGate.resolve(); await flush();
    assert.equal(rejectedStart.sdkOperations, 0, 'A rejected start still releases Core\'s queued end');
    assert.equal(rejectedStart.coreClearCalls, failure === 'failStartAfterSession' ? 1 : 0);
    assert.equal(rejectedStart.immediateEnds, 0);
    ready(rejectedStart); // No-active integration rejection is swallowed by the current Core video-end API.
  }
  for (const earlyActive of [false, true]) {
    const handshake = await kiosk({ startGate: deferred(), handshakeGate: deferred() });
    await handshake.start(); await handshake.end();
    assert.equal(handshake.ui.end.disabled, true); assert.equal(handshake.videoEnds, 0);
    assert.equal(handshake.focusedElement(), handshake.ui.waiting, 'Startup focuses the waiting status instead of disabled Cancel');
    handshake.startGate.resolve(); await flush();
    assert.equal(handshake.ui['video-container'].children.length, 1, 'Iframe creation does not finish the startup promise');
    if (earlyActive) handshake.core.callStarted();
    assert.equal(handshake.ui.end.disabled, true, 'Even an early connected event cannot enable End before the method returns');
    if (earlyActive) assert.equal(handshake.focusedElement(), handshake.core.ui.getIframeInstance(), 'Early connection moves focus into the call');
    await handshake.end(); assert.equal(handshake.videoEnds, 0);
    handshake.handshakeGate.resolve(); await flush();
    assert.equal(handshake.ui.end.disabled, false, 'Startup completion enables End/Cancel');
    assert.equal(handshake.ui.end.textContent, earlyActive ? 'End call' : 'Cancel request');
    assert.equal(handshake.focusedElement(), earlyActive ? handshake.core.ui.getIframeInstance() : handshake.ui.end, 'Completion preserves call focus or makes Cancel reachable');
    await handshake.end(); ready(handshake);
    assert.equal(handshake.videoEnds, 1); assert.equal(handshake.coreClearCalls, 1);
    assert.equal(handshake.ui['video-container'].children.length, 0);
  }
  for (const state of ['contactCenterInActiveInteraction', 'isCallOngoing']) {
    const stale = await kiosk(); stale.core[state] = true;
    await stale.start(); assert.equal(stale.starts, 0, 'Existing conversation/video is cleared instead of rebound');
    ready(stale); await stale.start(); assert.equal(stale.starts, 1);
  }
  for (const restored of [false, true]) {
    const delayed = await kiosk({ restored, delayedEnd: true });
    if (!restored) { await delayed.start(); await delayed.end(); }
    assert.equal(delayed.videoEnds, 1);
    ready(delayed);
    assert.equal([...delayed.timers.values()].some(timer => timer.ms === delayed.config.endTimeoutMs), false, 'Successful end command requires no extra sessionEnded wait');
    delayed.sessionEnded(); await flush(); ready(delayed);
    assert.equal(delayed.videoEnds, 1, 'A later sessionEnded event does not repeat cleanup');
  }
  const rejected = await kiosk({ authenticated: true, failVideoEnd: true });
  await rejected.start(); await rejected.end(); failed(rejected);
  assert.equal(rejected.videoEnds, 1); assert.equal(rejected.coreClearCalls, 0);
  assert.equal(rejected.immediateEnds, 0); assert.equal(rejected.clearCalls, 0); assert.equal(rejected.logouts, 0, 'A rejected end displays failure without fallback SDK cleanup');
  rejected.ui.retry.click(); await flush();
  assert.equal(rejected.reloads, 1); assert.equal(rejected.destroyCalls, 0, 'Full reload does not start SDK destruction');
  assert.equal(rejected.videoEnds, 1); assert.equal(rejected.immediateEnds, 1, 'Reload can request the single optional page-exit cleanup after failure');
  for (const failure of ['failStart', 'failStartAfterSession']) {
    const startupFailure = await kiosk({ [failure]: true }); await startupFailure.start(); failed(startupFailure);
    await startupFailure.end(); assert.equal(startupFailure.videoEnds, 1, 'Failed startup cannot enable an additional manual end');
  }
  const stuckEnd = await kiosk({ authenticated: true, endGate: deferred() }); await stuckEnd.start(); await stuckEnd.end();
  stuckEnd.fireTimer('endTimeoutMs'); await flush(); failed(stuckEnd);
  assert.equal(stuckEnd.videoEnds, 1); assert.equal(stuckEnd.immediateEnds, 0); assert.equal(stuckEnd.logouts, 0);
  stuckEnd.endGate.resolve(); await flush(); failed(stuckEnd);
  assert.equal(stuckEnd.videoEnds, 1); assert.equal(stuckEnd.clearCalls, 0); assert.equal(stuckEnd.immediateEnds, 0);
  assert.equal(stuckEnd.logouts, 0, 'An end timeout adds no fallback logout, even after the original end settles');
  const errors = await kiosk(); await errors.start(); errors.core.callStarted();
  errors.core.emit('error:catchAll', { code: 'genesys-operation|timeout', context: { commandName: 'MessagingService.startConversation' } });
  await flush(); assert.equal(errors.videoEnds, 0); assert.equal(errors.ui.end.textContent, 'End call');
  errors.core.emit('error:catchAll', { context: { authEvent: 'Auth.tokenError' } }); await flush(); failed(errors);
  assert.equal(errors.videoEnds, 1); assert.equal(errors.immediateEnds, 0, 'Terminal errors use the normal Core end API');
  const offline = await kiosk(); await offline.start(); offline.core.callStarted(); offline.dispatch('offline'); await flush(); failed(offline);
  assert.equal(offline.videoEnds, 1); assert.equal(offline.immediateEnds, 0, 'Offline handling uses the same normal cleanup path');
  for (const cleanupOnUnload of [false, true]) {
    const unload = await kiosk({ config: { cleanupOnUnload } }); await unload.start();
    unload.dispatch('beforeunload'); unload.dispatch('pagehide');
    assert.equal(unload.immediateEnds, cleanupOnUnload ? 1 : 0, 'Unload cleanup is optional and deduplicated');
    unload.dispatch('pageshow', { persisted: false }); assert.equal(unload.reloads, 0);
    unload.dispatch('pageshow', { persisted: true }); assert.equal(unload.reloads, 1, 'A cached SDK page reloads even when exit cleanup is disabled');
    const restored = await kiosk({ config: { cleanupOnUnload } });
    await restored.start(); assert.equal(restored.starts, 1, 'The replacement page can start a call');
  }
  for (const waitingScreen of [false, true]) {
    const waiting = await kiosk({ config: { waitingScreen }, startGate: deferred() });
    await waiting.start(); assert.equal(waiting.ui.waiting.hidden, false);
    assert.equal(waiting.ui.waiting.classList.contains('waiting-disabled'), !waitingScreen);
    waiting.startGate.resolve(); await flush();
    assert.equal(waiting.ui['video-container'].hidden, false, 'Camera setup stays accessible');
    assert.equal(waiting.ui.waiting.classList.contains('waiting-compact'), waiting.config.waitingScreenMode === 'beside');
    assert.equal(waiting.core.ui.getIframeInstance().title, 'Video assistance call');
    waiting.core.callStarted();
    assert.equal(waiting.ui.waiting.hidden, true); assert.equal(waiting.timers.size, 0);
  }
  for (const mode of ['remote', 'local', 'skip', 'timeout', 'disabled', 'no-connection', 'genesys-end']) {
    const survey = await kiosk({ config: { postCallSurvey: mode !== 'disabled' } }); await survey.start();
    assert.equal(survey.coreConfig.enableVeIframeCommands, true, 'Iframe commands are enabled regardless of survey settings');
    if (mode !== 'no-connection') survey.core.callStarted();
    if (mode === 'local') await survey.end();
    else if (mode === 'genesys-end') { survey.sessionEnded(); await flush(); }
    else { survey.core.callEnded(); await flush(); }
    assert.equal(survey.hangups, ['local', 'genesys-end'].includes(mode) ? 1 : 0);
    assert.equal(survey.videoEnds, 1);
    assert.equal(survey.coreClearCalls, mode === 'genesys-end' ? 0 : 1);
    if (['disabled', 'no-connection'].includes(mode)) { ready(survey); assert.equal(survey.ui['video-container'].children.length, 0); continue; }
    assert.equal(survey.ui['survey-done'].hidden, false);
    assert.equal(survey.ui['video-container'].hidden, false);
    assert.equal(survey.ui['video-container'].children.length, 1, 'Survey survives Core destruction/visibility callbacks');
    if (mode === 'timeout') survey.fireTimer('surveyTimeoutMs'); else survey.ui['survey-done'].click();
    ready(survey); assert.equal(survey.ui['video-container'].children.length, 0);
  }
  const noHangup = await kiosk({ config: { postCallSurvey: true }, delayedHangup: true });
  await noHangup.start(); noHangup.core.callStarted(); await noHangup.end();
  assert.equal(noHangup.hangups, 1);
  assert.equal(noHangup.videoEnds, 1, 'A completed hangup command does not require CallEnded');
  assert.equal(noHangup.ui['survey-done'].hidden, false);
}

async function checkConversationClearing() {
  for (const authenticated of [false, true]) {
    const view = await kiosk({ authenticated, startAfterLogin: authenticated,
      beforeIntegrationReady(core, fake) {
        core.contactCenterInActiveInteraction = true;
        core.emit('integration:sessionStarted');
        fake.sessionEnded();
      } });
    assert.equal(view.videoEnds, 1, 'A restored ended conversation goes through the single video-end API');
    assert.equal(view.coreClearCalls, 0, 'Current SDK cannot clear a conversation that is already inactive');
    assert.deepEqual(view.integrationEndErrors, ['No active conversation']);
    assert.equal(view.clearCalls, 0, 'The kiosk does not add a direct Messenger clear workaround');
    if (!authenticated) { ready(view); await view.start(); }
    assert.equal(view.starts, 1); assert.ok(view.core.ui.getIframeInstance());
  }
  for (const authMode of ['shared', 'perInteraction']) {
    for (const who of ['visitor', 'agent']) {
      for (const connected of [false, true]) {
        const gate = deferred();
        const view = await kiosk({ authenticated: true, authMode, endGate: gate });
        await view.start(); if (connected) view.core.callStarted();
        if (who === 'visitor') {
          await view.end();
          assert.equal(view.videoEnds, 1); assert.equal(view.coreClearCalls, 1);
          assert.equal(view.ui['video-container'].children.length, 0, 'Core closes video before awaiting the integration end');
          assert.equal(view.logouts, 0); assert.equal(view.reloads, 0);
          assert.equal(view.ui.start.disabled, true, 'The video-end promise precedes logout and kiosk reuse');
          gate.resolve(); await flush();
        } else {
          view.sessionEnded(); await flush();
          assert.equal(view.coreClearCalls, 0, 'Agent-ended inactive conversation receives no clear with the current SDK');
          assert.deepEqual(view.integrationEndErrors, ['No active conversation']);
        }
        view.core.emit('integration:sessionEnded');
        view.core.emit('videoEngager:call-state-changed', 'idle');
        view.core.emit('videoEngager:active-ve-instance', false); await flush();
        assert.equal(view.videoEnds, 1, 'Duplicate end events do not repeat the video-end request');
        assert.equal(view.clearCalls, 0); assert.equal(view.conversationEnds, 0);
        if (authMode === 'perInteraction') {
          assert.equal(view.logouts, 1); assert.equal(view.reloads, 1);
          const next = await kiosk({ authenticated: true, startAfterLogin: true });
          assert.equal(next.starts, 1); assert.ok(next.core.ui.getIframeInstance());
          assert.equal(next.videoEnds, 0, 'A new page does not end before any conversation has started');
        } else {
          ready(view); await view.start(); assert.equal(view.starts, 2);
          // This proves kiosk reuse only, not that live Genesys accepts reuse without an inactive clear.
          view.sessionEnded(); await flush(); ready(view);
          assert.equal(view.videoEnds, 2); assert.equal(view.coreClearCalls, who === 'visitor' ? 1 : 0);
          assert.equal(view.clearCalls, 0);
        }
      }
    }
    const survey = await kiosk({ authenticated: true, authMode, config: { postCallSurvey: true } });
    await survey.start(); survey.core.callStarted();
    const iframe = survey.core.ui.getIframeInstance();
    survey.sessionEnded(); await flush();
    assert.equal(survey.videoEnds, 1); assert.equal(survey.coreClearCalls, 0);
    assert.equal(survey.ui['survey-done'].hidden, false); assert.equal(survey.core.ui.getIframeInstance(), iframe);
    assert.equal(survey.reloads, 0, 'The video-end callback retains the survey until Finish / skip');
    survey.ui['survey-done'].click();
    assert.equal(survey.reloads, authMode === 'perInteraction' ? 1 : 0);
  }
  for (const authMode of ['anonymous', 'shared', 'perInteraction']) {
    const swallowed = await kiosk({ authenticated: authMode !== 'anonymous',
      authMode: authMode === 'anonymous' ? undefined : authMode, failConversationEnd: true });
    await swallowed.start(); await swallowed.end();
    assert.equal(swallowed.videoEnds, 1); assert.equal(swallowed.coreClearCalls, 1);
    assert.deepEqual(swallowed.integrationEndErrors, ['Messenger cleanup failed'], 'Current Core logs integration failure but resolves video end');
    assert.equal(swallowed.ui.error.hidden, true, 'The kiosk cannot detect an integration error swallowed by Core');
    assert.equal(swallowed.clearCalls, 0); assert.equal(swallowed.conversationEnds, 0);
    assert.equal(swallowed.ui['video-container'].children.length, 0);
    if (authMode === 'perInteraction') { assert.equal(swallowed.logouts, 1); assert.equal(swallowed.reloads, 1); }
    else { ready(swallowed); assert.equal(swallowed.core.contactCenterInActiveInteraction, true, 'Resolved video end is not proof of Genesys cleanup'); }
  }
}
async function checkCoreLifecycle() {
  for (const event of ['state-ended', 'idle', 'instance-ended', 'popup-closed', 'legacy-ended']) {
    const view = await kiosk({ config: { postCallSurvey: true } }); await view.start();
    assert.equal(view.ui.end.textContent, 'Cancel request', 'An active iframe does not mean an active call');
    view.core.setCallState('active');
    assert.equal(view.ui.end.textContent, 'End call', 'Call state alone can mark a call connected');
    const iframe = view.core.ui.getIframeInstance();
    let legacyEvents = 0; view.core.on('videoEngager:CallEnded', () => { legacyEvents++; });
    if (event === 'state-ended') view.core.callEnded(false);
    else if (event === 'idle') view.core.setCallState('idle');
    else if (event === 'instance-ended') view.core.setInstanceActive(false);
    else if (event === 'popup-closed') view.core.popupClosed();
    else view.core.emit('videoEngager:CallEnded');
    await flush();
    assert.equal(legacyEvents, event === 'legacy-ended' ? 1 : 0);
    assert.equal(view.videoEnds, 1, `${event} ends the Genesys conversation once`);
    assert.equal(view.core.ui.getIframeInstance(), iframe, `${event} preserves the survey iframe`);
    assert.equal(view.ui['survey-done'].hidden, false);
  }
  const waiting = await kiosk(); await waiting.start(); waiting.core.popupClosed(); await flush();
  ready(waiting); assert.equal(waiting.videoEnds, 1, 'Closing before connection finishes through active-instance false');

  const error = { context: { authEvent: 'Auth.authError' } };
  const terminal = await kiosk({ authenticated: true, delayedLogout: true }); await terminal.start();
  terminal.core.emit('error:catchAll', error); await flush(); failed(terminal);
  assert.equal(terminal.videoEnds, 1); assert.equal(terminal.logouts, 1); assert.equal(terminal.immediateEnds, 0);
  terminal.loggedOut(); await flush(); failed(terminal);
  assert.equal(terminal.videoEnds, 1); assert.equal(terminal.logouts, 1, 'A later expected logout does not restart cleanup');
  const duplicate = await kiosk({ authenticated: true, endGate: deferred() }); await duplicate.start();
  duplicate.core.emit('error:catchAll', error); await flush();
  assert.equal(duplicate.videoEnds, 1); assert.equal(duplicate.ui.error.hidden, true, 'First fatal event awaits normal cleanup before showing failure');
  for (let i = 0; i < 3; i++) duplicate.core.emit('error:catchAll', error);
  failed(duplicate); assert.equal(duplicate.videoEnds, 1, 'Fatal events during ending show failure without another Core end');
  assert.equal(duplicate.logouts, 0);
  duplicate.endGate.resolve(); await flush(); failed(duplicate);
  duplicate.core.emit('integration:sessionStarted'); duplicate.core.emit('error:catchAll', error); await flush();
  assert.equal(duplicate.videoEnds, 1); assert.equal(duplicate.coreClearCalls, 1); assert.equal(duplicate.clearCalls, 0);
  assert.equal(duplicate.immediateEnds, 0); assert.equal(duplicate.logouts, 1, 'The original cleanup may finish its planned logout, but duplicate errors add none');
  assert.equal(duplicate.reloads, 0); assert.equal(duplicate.starts, 1);
}

async function checkWaitingModes() {
  function message(view, name, overrides = {}) {
    const iframe = view.core.ui.getIframeInstance();
    view.dispatch('message', {
      source: iframe?.contentWindow, origin: iframe ? new URL(iframe.src).origin : 'https://example.test',
      data: { __postRobot__: { name: `VideoEngager.event:${name}` } }, ...overrides
    });
  }
  const overlay = view => view.body.classList.contains('waiting-overlay');
  const rotation = view => [...view.timers.values()].some(timer => timer.ms === 8000);
  for (const waitingScreenMode of ['overlay', 'beside']) {
    const view = await kiosk({ config: { waitingScreenMode }, endGate: deferred() }); await view.start();
    const iframe = view.core.ui.getIframeInstance();
    assert.equal(overlay(view), waitingScreenMode === 'overlay');
    assert.equal(view.ui['video-container'].inert, waitingScreenMode === 'overlay', 'Covered iframe cannot receive keyboard focus');
    assert.equal(view.ui.waiting.hidden, false);
    for (const overrides of [{ origin: 'https://wrong.example' }, { source: {} }, { data: '{bad json' }, { data: null }]) {
      message(view, 'PreCallStarted', overrides); assert.equal(view.ui.waiting.hidden, false, 'Untrusted/malformed precall messages are ignored');
    }
    message(view, 'Unknown'); assert.equal(view.ui.waiting.hidden, false);
    message(view, 'PreCallStarted');
    assert.equal(view.ui.waiting.hidden, waitingScreenMode === 'overlay', 'Precall hides only an overlay; beside tips stay visible');
    assert.equal(overlay(view), false); assert.equal(rotation(view), waitingScreenMode === 'beside');
    assert.equal(view.ui['video-container'].hidden, false, 'Precall keeps the camera setup visible');
    assert.equal(view.ui['video-container'].inert, false, 'Precall makes the iframe interactive');
    message(view, 'PreCallFinished');
    assert.equal(view.ui.waiting.hidden, false); assert.equal(overlay(view), waitingScreenMode === 'overlay');
    assert.equal(rotation(view), true);
    if (waitingScreenMode === 'overlay') {
      const next = view.ui.waiting.querySelector('[data-waiting-next]'); next.click(); next.focus();
      message(view, 'PreCallStarted', { data: JSON.stringify({ __postRobot__: { name: 'VideoEngager.event:PreCallStarted' } }) });
      assert.equal(view.focusedElement(), iframe, 'Precall moves focus out of hidden waiting controls');
      message(view, 'PreCallFinished');
      assert.equal(rotation(view), false, 'Precall preserves the visitor pause choice');
      assert.equal(view.ui.waiting.querySelectorAll('[data-waiting-slide]')[1].hidden, false, 'Precall preserves the chosen slide');
      assert.equal(view.focusedElement(), view.ui.end, 'Returning overlay moves focus out of the covered iframe');
    }
    message(view, 'PreCallStarted'); view.core.callStarted(); message(view, 'PreCallFinished');
    assert.equal(view.ui.waiting.hidden, true); assert.equal(overlay(view), false, 'CallStarted wins over late precall events');
    assert.equal(view.core.ui.getIframeInstance(), iframe);
    await view.end(); message(view, 'PreCallFinished');
    assert.equal(overlay(view), false); assert.equal(rotation(view), false, 'Ending never restores the waiting carousel');
    view.endGate.resolve(); await flush(); ready(view);
    await view.start();
    assert.notEqual(view.core.ui.getIframeInstance(), iframe);
    message(view, 'PreCallStarted', { source: iframe.contentWindow });
    assert.equal(view.ui.waiting.hidden, false, 'A stale iframe cannot hide the next visitor waiting screen');
    view.dispatch('offline'); message(view, 'PreCallFinished', { source: iframe.contentWindow }); await flush(); failed(view);
    assert.equal(view.ui.waiting.hidden, true); assert.equal(rotation(view), false);
  }
  const disabled = await kiosk({ config: { waitingScreen: false, waitingScreenMode: 'overlay' } }); await disabled.start();
  assert.equal(overlay(disabled), false); assert.equal(rotation(disabled), false);
  message(disabled, 'PreCallStarted'); assert.equal(disabled.ui.waiting.hidden, true);
  message(disabled, 'PreCallFinished'); assert.equal(overlay(disabled), false);
}

async function checkWaitingCarousel() {
  const carouselTimers = fake => [...fake.timers].filter(([, timer]) => timer.ms === 8000);
  const view = await kiosk(); await view.start();
  const waiting = view.ui.waiting;
  const slides = waiting.querySelectorAll('[data-waiting-slide]');
  const current = () => slides.findIndex(slide => !slide.hidden);
  const button = name => waiting.querySelector(`[data-waiting-${name}]`);
  assert.equal(slides.length, 3); assert.equal(current(), 0); assert.equal(carouselTimers(view).length, 1);
  view.fireTimer(8000); assert.equal(current(), 1);
  const timer = carouselTimers(view)[0][0];
  view.core.ui.setIframeVisibility(true);
  assert.equal(current(), 1); assert.equal(carouselTimers(view)[0][0], timer, 'Repeated show preserves slide and timer');
  view.fireTimer(8000); view.fireTimer(8000); assert.equal(current(), 0, 'Automatic rotation wraps');
  button('previous').click(); assert.equal(current(), 2); assert.equal(carouselTimers(view).length, 0);
  button('next').click(); assert.equal(current(), 0, 'Manual navigation wraps and stays paused');
  assert.equal(carouselTimers(view).length, 0);
  button('toggle').click(); assert.equal(carouselTimers(view).length, 1);
  button('toggle').click(); assert.equal(carouselTimers(view).length, 0, 'Pause stops rotation');
  button('toggle').click(); waiting.querySelector('[data-waiting-carousel]').dispatch('focusin', { target: button('next') });
  assert.equal(carouselTimers(view).length, 0, 'Keyboard focus pauses rotation');
  view.core.ui.setIframeVisibility(true); assert.equal(carouselTimers(view).length, 0, 'Status updates do not resume a paused carousel');
  button('next').click(); assert.equal(current(), 1);
  button('next').focus();
  view.core.callStarted();
  assert.equal(view.focusedElement(), view.ui.end, 'Connection moves focus out of the hidden carousel');
  assert.equal(waiting.hidden, true); assert.equal(current(), 0, 'Hiding resets to the first slide');
  assert.equal(carouselTimers(view).length, 0);
  await view.end(); await view.start();
  assert.equal(current(), 0); assert.equal(carouselTimers(view).length, 1, 'A new visitor starts unpaused');
  view.setReducedMotion(true); assert.equal(carouselTimers(view).length, 0); assert.equal(button('toggle').hidden, true);
  view.setReducedMotion(false); assert.equal(carouselTimers(view).length, 1); assert.equal(button('toggle').hidden, false);
  for (const options of [{ config: { waitingScreen: false } }, { reducedMotion: true }]) {
    const quiet = await kiosk(options); await quiet.start();
    assert.equal(carouselTimers(quiet).length, 0, 'Disabled/reduced-motion screens never auto-rotate');
  }
  const ending = await kiosk({ endGate: deferred() }); await ending.start(); await ending.end();
  assert.equal(ending.ui.waiting.classList.contains('waiting-status-only'), true);
  assert.equal(carouselTimers(ending).length, 0, 'Cleanup does not rotate slides');
  ending.endGate.resolve(); await flush(); ready(ending);
  const authenticating = await kiosk({ authenticated: true, authGate: deferred() }); await authenticating.start();
  assert.equal(authenticating.ui.waiting.classList.contains('waiting-status-only'), true);
  assert.equal(carouselTimers(authenticating).length, 0, 'Authentication does not rotate slides');
}

async function checkFullscreen() {
  for (const reducedMotion of [false, true]) {
    const view = await kiosk({ reducedMotion, config: { postCallSurvey: true }, endGate: deferred() });
    await view.start();
    const iframe = view.core.ui.getIframeInstance();
    assert.equal(view.body.classList.contains('call-active'), false);
    iframe.focus();
    view.core.callStarted();
    assert.equal(view.focusedElement(), iframe, 'Expansion preserves focus already in the call');
    assert.equal(view.body.classList.contains('call-active'), true);
    assert.equal(view.core.ui.getIframeInstance(), iframe, 'Expansion retains the live iframe');
    assert.equal(view.animations.length, reducedMotion ? 0 : 1, 'Reduced motion skips expansion animation');
    if (!reducedMotion) assert.equal(view.animations[0].frames.at(-1).transform, 'none');
    await view.end();
    assert.equal(view.body.classList.contains('call-active'), false, 'Ending immediately restores normal layout');
    assert.equal(view.core.ui.getIframeInstance(), iframe, 'Ending retains the iframe while cleanup waits');
    if (!reducedMotion) assert.equal(view.animations[0].cancelled, true);
    view.endGate.resolve(); await flush();
    assert.equal(view.ui['survey-done'].hidden, false);
    assert.equal(view.body.classList.contains('call-active'), false);
    assert.equal(view.core.ui.getIframeInstance(), iframe, 'The survey uses the same iframe');
    view.ui['survey-done'].click(); ready(view);
  }
}

async function checkChatController() {
  const classes = new Set(), commands = [], warnings = [];
  let commandError;
  const window = {
    Genesys(type, command, _data, resolve, reject) {
      assert.equal(type, 'command', 'The appearance controller never subscribes to SDK events');
      commands.push(command);
      if (commandError) reject(commandError); else resolve();
    }
  };
  const document = { body: { classList: {
    add: name => classes.add(name), remove: name => classes.delete(name),
    toggle(name, value) { value ? classes.add(name) : classes.delete(name); }
  } } };
  runInNewContext(source('chat-ui.js'), { window, document, console: { warn: (...args) => warnings.push(args) } });
  const chat = window.createKioskChat();
  assert.deepEqual(Object.keys(chat).sort(), ['hide', 'minimize', 'open', 'show']);
  assert.deepEqual(commands, [], 'Construction needs no config and issues no SDK commands');
  chat.hide(); assert.equal(classes.has('messenger-hidden'), true);
  chat.show(); assert.equal(classes.has('messenger-hidden'), false);
  assert.deepEqual(commands, [], 'Showing and hiding only changes CSS');
  for (const method of ['open', 'open', 'minimize']) {
    const request = chat[method]();
    assert.equal(typeof request?.then, 'function', 'Explicit commands return promises the app can drain');
    await request;
  }
  assert.deepEqual(commands, ['Messenger.open', 'Messenger.open', 'Messenger.close'], 'Every explicit request issues its command without visit policy');
  for (const [method, exact] of [['open', 'Messenger is already opened.'], ['minimize', 'Messenger is already closed.']]) {
    for (const error of [exact, Error(exact)]) { commandError = error; await chat[method](); }
  }
  assert.equal(warnings.length, 0, 'Exact already-open and already-closed responses are harmless');
  for (const [method, error] of [['open', 'Messenger is already opened. Retry.'], ['minimize', Error('Messenger is already closed. Retry.')]]) {
    commandError = error; await chat[method]();
  }
  assert.equal(warnings.length, 2, 'Other command errors warn and return a handled promise');
  assert.equal(classes.has('messenger-hidden'), false, 'Command success or failure does not change CSS visibility');
}

async function checkChat() {
  const views = [];
  const setup = async options => { const view = await kiosk(options); views.push(view); return view; };
  const visible = view => !view.body.classList.contains('messenger-hidden');
  const receive = (view, messages) => messages.forEach(message => view.core.emit('integration:raw-message', message));
  const reply = { messageType: 'outbound', type: 'text', text: 'Hello from the agent' };
  for (const chatMode of ['hidden', 'onActivity', 'always', 'afterStart']) {
    for (const chatMinimized of [false, true]) {
      const view = await setup({ config: { chatMode, chatMinimized } });
      assert.equal(visible(view), chatMode === 'always');
      if (chatMode === 'always') {
        view.chatOpen = chatMinimized; // The visitor changes the initial preference on welcome.
      }
      await view.start();
      assert.equal(visible(view), ['always', 'afterStart'].includes(chatMode));
      if (chatMode === 'always') assert.equal(view.chatOpen, chatMinimized, 'Start preserves a manual toggle made on welcome');
      view.core.callStarted(); await flush();
      assert.equal(visible(view), chatMode !== 'hidden');
      assert.deepEqual(view.chatCommands, chatMode === 'hidden' ? [] : [chatMinimized ? 'Messenger.close' : 'Messenger.open']);
      view.chatOpen = chatMinimized; // A manual toggle during this visit is also preserved.
      receive(view, [reply]); await flush();
      assert.equal(view.chatCommands.length, chatMode === 'hidden' ? 0 : 1, 'Manual open/close is respected for the current visitor');
      assert.equal(view.chatOpen, chatMinimized);
      await view.end(); ready(view);
      assert.equal(view.chatCommands.length, chatMode === 'hidden' ? 0 : chatMode === 'always' ? 2 : 1, 'Only always mode applies the next visitor preference on welcome');
      await view.start(); view.core.callStarted(); await flush();
      assert.equal(view.chatCommands.length, chatMode === 'hidden' ? 0 : 2, 'Each subsequent visitor gets one fresh appearance attempt');
    }
  }
  // Core emits formatted fields for text, attachments and cards, including restored messages.
  for (const message of [reply,
    { messageType: 'outbound', type: 'text', files: [{ name: 'guide.pdf', downloadUrl: 'https://example.test/guide.pdf' }] },
    { messageType: 'outbound', type: 'structured', card: { title: 'Options' }, timestamp: '2020-01-01T00:00:00Z' }]) {
    const view = await setup({ config: { chatMode: 'onActivity' }, startGate: deferred(), endGate: deferred() });
    receive(view, [message]); await flush();
    assert.equal(visible(view), false, 'Messages outside a visitor session do not reveal chat');
    await view.start();
    receive(view, [null, undefined, {}, { ...reply, messageType: 'inbound' }, { ...reply, type: 'event' },
      { direction: 'Outbound', type: 'Text', text: 'Unformatted SDK payload' }]); await flush();
    assert.equal(view.chatCommands.length, 0, 'Only formatted outbound non-event messages reveal chat');
    assert.equal(visible(view), false);
    receive(view, [message]); await flush();
    assert.equal(view.chatCommands.length, 0, 'An eligible Core message waits for the SDK start to finish');
    assert.equal(visible(view), false, 'An eligible Core message is remembered while start keeps chat paused');
    view.startGate.resolve(); await flush();
    assert.equal(visible(view), true); assert.equal(view.chatCommands.length, 1);
    await view.end(); receive(view, [reply]); await flush();
    assert.equal(visible(view), false); assert.equal(view.chatCommands.length, 1, 'No chat command during cleanup');
    view.endGate.resolve(); await flush(); ready(view); assert.equal(visible(view), false);
  }
  const initializing = await setup({ integrationGate: deferred(), config: { chatMode: 'always' } });
  assert.equal(initializing.sdkOperations, 1); assert.equal(initializing.chatCommands.length, 0, 'No appearance command before Core integration initialization resolves');
  initializing.integrationGate.resolve(); await flush();
  assert.equal(visible(initializing), true); assert.equal(initializing.chatCommands.length, 1, 'Core integration completion permits the initial preference');
  const authPending = await setup({ authenticated: true, authGate: deferred(), config: { chatMode: 'always' } });
  assert.equal(authPending.core, undefined); assert.equal(authPending.chatCommands.length, 0);
  await authPending.start(); receive(authPending, [reply]); await flush();
  assert.equal(authPending.starts, 0); assert.equal(authPending.chatCommands.length, 0, 'Authentication inside Core initialization also blocks appearance commands');
  authPending.authGate.resolve(); await flush(); assert.equal(authPending.starts, 1); assert.equal(visible(authPending), true);

  for (const chatMinimized of [false, true]) {
    const opening = await setup({ chatGate: deferred(), config: { chatMode: 'always', chatMinimized } });
    assert.equal(opening.pendingChatCommands, 1); assert.equal(visible(opening), true, 'Pending appearance commands do not hide chat');
    await opening.start();
    assert.equal(opening.starts, 0, 'Starting a call drains a pending Messenger UI command');
    opening.chatGate.resolve(); await flush(); assert.equal(opening.starts, 1);
    assert.equal(opening.chatCommands.length, 1, 'Starting does not reset the welcome-screen appearance attempt');
  }
  for (const state of ['contactCenterInActiveInteraction', 'isCallOngoing', 'conversationNeedsClear']) {
    const restored = await setup({ chatGate: deferred(), config: { chatMode: 'always' } });
    await restored.start(); assert.equal(restored.starts, 0);
    if (state === 'conversationNeedsClear') restored.core.emit('integration:sessionStarted');
    else restored.core[state] = true;
    restored.chatGate.resolve(); await flush();
    assert.equal(restored.starts, 0, `${state} appearing during chat drain cannot bind a new visitor`);
    assert.equal(restored.videoEnds, 1, 'The restored session gets one video-end request');
    assert.equal(restored.coreClearCalls, state === 'contactCenterInActiveInteraction' ? 1 : 0);
    ready(restored);
    await restored.start(); assert.equal(restored.starts, 1, 'A fresh call can start after clearing');
  }
  for (const expire of [false, true]) {
    const abandoned = await setup({ chatGate: deferred(), config: { chatMode: 'always' } });
    await abandoned.start(); await abandoned.end();
    assert.equal(abandoned.ui.end.disabled, true);
    assert.equal(abandoned.videoEnds, 0, 'A request still draining chat has not submitted a Core start or end');
    abandoned.fireTimer('maxWaitMs'); await flush();
    if (expire) { abandoned.fireTimer('endTimeoutMs'); await flush(); failed(abandoned); }
    abandoned.chatGate.resolve(); await flush();
    assert.equal(abandoned.starts, 0, 'A cancelled request waiting for Messenger never starts a late call');
    assert.equal(abandoned.videoEnds, expire ? 0 : 1, 'A completed cancellation uses video end; an expired prerequisite does not submit it later');
    assert.equal(abandoned.coreClearCalls, 0, 'No conversation was started while chat was still pending');
    assert.equal(abandoned.immediateEnds, 0, 'Cancelling a chat drain needs no emergency clear');
    if (expire) failed(abandoned); else ready(abandoned);
  }
  const ending = await setup({ authenticated: true, config: { chatMode: 'onActivity' } });
  await ending.start(); ending.chatGate = deferred(); receive(ending, [reply]); await flush();
  await ending.end(); assert.equal(ending.videoEnds, 0); assert.equal(ending.logouts, 0);
  receive(ending, [reply]); await flush();
  assert.equal(ending.pendingChatCommands, 1); assert.equal(ending.chatCommands.length, 1);
  assert.equal(ending.videoEnds, 0, 'Ending keeps the original appearance promise until it drains');
  assert.equal(visible(ending), false);
  ending.chatGate.resolve(); await flush();
  assert.equal(ending.videoEnds, 1); assert.equal(ending.logouts, 1); assert.equal(ending.reloads, 1);
  const signingOut = await setup({ authenticated: true, logoutGate: deferred(), config: { chatMode: 'always', postCallSurvey: true } });
  await signingOut.start(); signingOut.core.callStarted(); const iframe = signingOut.core.ui.getIframeInstance();
  signingOut.sessionEnded(); await flush();
  const commandCount = signingOut.chatCommands.length;
  receive(signingOut, [reply]); await flush();
  assert.equal(signingOut.chatCommands.length, commandCount); assert.equal(visible(signingOut), false);
  signingOut.logoutGate.resolve(); await flush();
  assert.equal(signingOut.ui['survey-done'].hidden, false); assert.equal(signingOut.core.ui.getIframeInstance(), iframe);
  assert.equal(visible(signingOut), false, 'A signed-out visitor keeps the survey without reopening Messenger');

  const cancelled = await setup({ startGate: deferred(), config: { chatMode: 'onActivity' } });
  await cancelled.start(); receive(cancelled, [reply]); await cancelled.end();
  assert.equal(cancelled.ui.end.disabled, true); assert.equal(cancelled.videoEnds, 0);
  cancelled.fireTimer('maxWaitMs'); await flush();
  cancelled.startGate.resolve(); await flush(); ready(cancelled);
  assert.equal(cancelled.chatCommands.length, 0, 'Cancelled startup discards queued chat activity');
  receive(cancelled, [reply]); await flush();
  assert.equal(visible(cancelled), false);
  for (const chatMinimized of [false, true]) {
    const exact = chatMinimized ? 'Messenger is already closed.' : 'Messenger is already opened.';
    const matched = await setup({ chatError: chatMinimized ? Error(exact) : exact, config: { chatMode: 'afterStart', chatMinimized } });
    await matched.start(); assert.equal(visible(matched), true); assert.equal(matched.warnings.length, 0);
    const failedChat = await setup({ chatError: `${exact} Retry.`, config: { chatMode: 'afterStart', chatMinimized } });
    await failedChat.start(); assert.equal(visible(failedChat), true, 'A failed initial preference does not hide Messenger'); assert.equal(failedChat.warnings.length, 1);
    receive(failedChat, [reply]); await flush();
    assert.equal(failedChat.chatCommands.length, 1, 'Appearance failure does not retry in a loop');
    assert.equal(failedChat.warnings.length, 1);
    await failedChat.end(); failedChat.chatError = null; await failedChat.start();
    assert.equal(failedChat.chatCommands.length, 2); assert.equal(visible(failedChat), true, 'A new visitor can retry appearance');
  }
  for (const view of views) assert.deepEqual(view.overlaps, [], 'Chat and conversation SDK commands never overlap');
}

async function checkAuthenticatedKiosk() {
  for (const search of ['?code=invalid&state=unknown', '?code=invalid&state=unknown&auth=false']) {
    const invalid = await kiosk({ search });
    failed(invalid);
    assert.equal(invalid.core, undefined, 'Invalid callback cannot initialize anonymous Core');
    assert.equal(invalid.authCalls, 0, 'Invalid callback is rejected before provider creation');
    await invalid.start(); assert.equal(invalid.starts, 0);
    assert.equal(invalid.ui.retry.textContent, 'Configure kiosk');
    invalid.ui.retry.click();
    assert.deepEqual(invalid.navigations, ['configurator.html']);
    assert.equal(invalid.reloads, 0, 'Unrecoverable sign-in opens configuration instead of anonymous defaults');
  }
  const expiredSettings = '?auth=true&authMode=perInteraction&kioskId=Authenticated-Lobby';
  const expiredTransaction = { state: 'expired', codeVerifier: 'verifier', nonce: 'nonce', redirectUri: 'https://kiosk.example/demo/index.html', appSearch: expiredSettings, createdAt: Date.now() - 601000 };
  const expired = await kiosk({ search: '?code=one-use&state=expired', storage: new Map([[transactionKey, JSON.stringify(expiredTransaction)]]) });
  failed(expired); assert.equal(expired.core, undefined);
  assert.equal(expired.ui.retry.textContent, 'Reload kiosk');
  expired.ui.retry.click(); assert.equal(expired.reloads, 1);
  assert.deepEqual(expired.navigations, []);
  for (const authMode of ['shared', 'perInteraction']) {
    const signedIn = await kiosk({ authenticated: true, authMode, integrationGate: deferred(), delayedLogout: true });
    ready(signedIn); assert.equal(signedIn.core, undefined, 'Welcome does not initialize authenticated Genesys');
    assert.equal(signedIn.authConfig.shouldStartAfterLogin(), false, 'Ready does not request a new call after login');
    await signedIn.start(); assert.equal(signedIn.starts, 0);
    assert.equal(signedIn.ui.end.disabled, true, 'Sign-in cannot be cancelled with the End button');
    assert.equal(signedIn.focusedElement(), signedIn.ui.waiting, 'Authentication focuses its status instead of disabled Cancel');
    await signedIn.end(); assert.equal(signedIn.videoEnds, 0); assert.equal(signedIn.authCancels, 0);
    assert.equal(signedIn.authConfig.shouldStartAfterLogin(), true, 'Only the authenticating phase requests a call after login');
    signedIn.integrationGate.resolve(); await flush();
    assert.equal(signedIn.starts, 1); assert.equal(signedIn.authCalls, 1);
    assert.equal(signedIn.integration.config.authProvider, signedIn.authProvider);
    assert.equal(signedIn.authConfig.shouldStartAfterLogin(), false, 'Waiting is not a new call request');
    signedIn.core.callStarted();
    assert.equal(signedIn.authConfig.shouldStartAfterLogin(), false, 'An active call is not a new call request');
    await signedIn.end();
    assert.equal(signedIn.logouts, authMode === 'perInteraction' ? 1 : 0);
    if (authMode === 'shared') {
      ready(signedIn); assert.equal(signedIn.authCancels, 0, 'Shared login remains usable');
      await signedIn.start(); assert.equal(signedIn.starts, 2); assert.equal(signedIn.authCalls, 1);
    } else {
      assert.equal(signedIn.reloads, 1, 'Successful logout command requires no extra Auth.loggedOut wait');
      assert.equal(signedIn.destroyCalls, 0); assert.equal(signedIn.videoEnds, 1);
      assert.equal(signedIn.ui.start.disabled, true);
      signedIn.loggedOut(); await flush();
      assert.equal(signedIn.reloads, 1); assert.equal(signedIn.ui.error.hidden, true, 'Expected logout is not fatal');
    }
  }
  const redirect = await kiosk({ authenticated: true, redirectOnAuth: true });
  assert.equal(redirect.redirects, 0); await redirect.start();
  assert.equal(redirect.redirects, 1); assert.equal(redirect.starts, 0, 'No call before callback authentication');
  const resumed = await kiosk({ authenticated: true, startAfterLogin: true, integrationGate: deferred() });
  assert.equal(resumed.starts, 0);
  resumed.integrationGate.resolve(); await flush(); assert.equal(resumed.starts, 1, 'Valid call intent resumes after authentication');
  for (const authMode of ['shared', 'perInteraction']) {
    const transaction = { ...expiredTransaction, state: 'no-intent', startAfterLogin: false, createdAt: Date.now(), appSearch: `?auth=true&authMode=${authMode}` };
    const storage = new Map([[transactionKey, JSON.stringify(transaction)]]);
    const noIntent = await kiosk({ search: '?code=valid&state=no-intent', storage, startAfterLogin: false });
    ready(noIntent); assert.equal(noIntent.core, undefined); assert.equal(noIntent.starts, 0);
    assert.equal(storage.has(transactionKey), false, 'A valid callback without call intent was processed');
    assert.equal(noIntent.authProvider.grantConsumed, false);
    await noIntent.start();
    assert.equal(noIntent.starts, 1, 'Login without call intent waits for a manual Start');
    assert.equal(noIntent.authProvider.grantConsumed, true);
  }
  const inherited = await kiosk({ authenticated: true, savedAuth: true, restored: true, delayedLogout: true });
  await inherited.start(); assert.equal(inherited.videoEnds, 1); assert.equal(inherited.logouts, 1);
  assert.equal(inherited.redirects, 1); assert.equal(inherited.starts, 0, 'Saved identity cannot start a visitor call');
  inherited.loggedOut(); await flush();
  assert.equal(inherited.redirects, 1); assert.equal(inherited.starts, 0); assert.equal(inherited.authCancels, 0);
  inherited.dispatch('beforeunload'); assert.equal(inherited.logouts, 1, 'PKCE navigation does not log out again');
  for (const option of ['stuckLogout', 'failLogout']) {
    const broken = await kiosk({ authenticated: true, [option]: true }); await broken.start(); await broken.end();
    if (option !== 'failLogout') { broken.fireTimer('endTimeoutMs'); await flush(); }
    failed(broken); assert.equal(broken.reloads, 0, 'A failed or stuck logout command requires explicit recovery');
    broken.loggedOut(); await flush(); failed(broken);
  }
  const pending = await kiosk({ authenticated: true, authGate: deferred() }); await pending.start(); await pending.end();
  assert.equal(pending.ui.end.disabled, true); assert.equal(pending.authCancels, 0, 'A disabled Cancel click leaves authentication pending');
  pending.dispatch('offline'); await flush();
  assert.equal(pending.videoEnds, 0, 'Authentication is awaited before any Core end is submitted');
  assert.equal(pending.logouts, 0, 'Pending authentication cannot race Messenger logout');
  assert.ok(pending.authCancels); pending.fireTimer('endTimeoutMs'); await flush(); failed(pending);
  pending.authGate.resolve(); await flush(); failed(pending);
  assert.equal(pending.starts, 0); assert.equal(pending.redirects, 0, 'Cancelled authentication cannot redirect later');
  assert.equal(pending.immediateEnds, 0, 'Authentication cancellation does not submit duplicate emergency cleanup');
  const queuedEnd = await kiosk({ authenticated: true, startGate: deferred(), endGate: deferred(), config: { chatMode: 'afterStart' } });
  await queuedEnd.start(); await queuedEnd.end();
  assert.equal(queuedEnd.ui.end.disabled, true); assert.equal(queuedEnd.videoEnds, 0);
  queuedEnd.fireTimer('maxWaitMs'); await flush();
  assert.equal(queuedEnd.videoEnds, 1); assert.equal(queuedEnd.coreClearCalls, 0);
  assert.equal(queuedEnd.logouts, 0, 'Logout waits for the queued Core end');
  queuedEnd.fireTimer('endTimeoutMs'); await flush(); failed(queuedEnd);
  assert.equal(queuedEnd.immediateEnds, 0); assert.equal(queuedEnd.logouts, 0, 'The UI deadline does not race Core with logout');
  queuedEnd.startGate.resolve(); await flush();
  assert.equal(queuedEnd.coreClearCalls, 1, 'Core still clears after the expired kiosk wait');
  queuedEnd.core.emit('integration:sessionStarted');
  queuedEnd.endGate.resolve(); await flush(); failed(queuedEnd);
  queuedEnd.core.callStarted();
  queuedEnd.core.emit('integration:raw-message', { messageType: 'outbound', type: 'text', text: 'Late reply' });
  await queuedEnd.start(); await flush(); failed(queuedEnd);
  assert.equal(queuedEnd.videoEnds, 1); assert.equal(queuedEnd.coreClearCalls, 1); assert.equal(queuedEnd.immediateEnds, 0);
  assert.equal(queuedEnd.clearCalls, 0, 'Late session events do not add another clear command');
  assert.equal(queuedEnd.starts, 1); assert.equal(queuedEnd.logouts, 0); assert.equal(queuedEnd.reloads, 0);
  assert.equal(queuedEnd.chatCommands.length, 0); assert.equal(queuedEnd.body.classList.contains('messenger-hidden'), true);
  assert.equal(queuedEnd.sdkOperations, 0, 'The submitted Core end settled without restoring the failed kiosk');
  for (const gate of ['chatGate', 'hangupGate']) {
    const beforeEnd = await kiosk({ authenticated: true, [gate]: deferred(),
      config: { chatMode: gate === 'chatGate' ? 'onActivity' : 'hidden', postCallSurvey: gate === 'hangupGate' } });
    await beforeEnd.start(); beforeEnd.core.callStarted(); await flush();
    assert.equal(beforeEnd.core.contactCenterInActiveInteraction, true);
    assert.equal(beforeEnd.pendingChatCommands, gate === 'chatGate' ? 1 : 0);
    await beforeEnd.end();
    assert.equal(beforeEnd.hangups, gate === 'hangupGate' ? 1 : 0);
    assert.equal(beforeEnd.videoEnds, 0, `${gate} blocks before Core end submission`);
    assert.equal(beforeEnd.immediateEnds, 0); assert.equal(beforeEnd.logouts, 0);
    beforeEnd.fireTimer('endTimeoutMs'); await flush(); failed(beforeEnd);
    assert.equal(beforeEnd.immediateEnds, 0, `${gate} timeout displays failure without an emergency clear`);
    assert.equal(beforeEnd.logouts, 0, 'Failure does not start an additional authentication cleanup');
    const chatCount = beforeEnd.chatCommands.length;
    beforeEnd[gate].resolve(); await flush(); failed(beforeEnd);
    beforeEnd.core.emit('integration:sessionStarted');
    beforeEnd.core.emit('integration:raw-message', { messageType: 'outbound', type: 'text', text: 'Late reply' });
    await beforeEnd.start(); failed(beforeEnd);
    assert.equal(beforeEnd.videoEnds, 0); assert.equal(beforeEnd.coreClearCalls, 0); assert.equal(beforeEnd.clearCalls, 0);
    assert.equal(beforeEnd.immediateEnds, 0, 'Late completion cannot add a fallback clear');
    assert.equal(beforeEnd.logouts, 0); assert.equal(beforeEnd.starts, 1); assert.equal(beforeEnd.reloads, 0);
    assert.equal(beforeEnd.chatCommands.length, chatCount); assert.equal(beforeEnd.body.classList.contains('messenger-hidden'), true);
  }
  const lateInit = await kiosk({ authenticated: true, savedAuth: true, integrationGate: deferred() });
  await lateInit.start(); await lateInit.end();
  assert.equal(lateInit.ui.end.disabled, true); assert.equal(lateInit.videoEnds, 0);
  lateInit.dispatch('offline'); await flush(); lateInit.fireTimer('endTimeoutMs'); await flush(); failed(lateInit);
  lateInit.integrationGate.resolve(); await flush();
  failed(lateInit); assert.equal(lateInit.starts, 0); assert.equal(lateInit.logouts, 1, 'Late authentication is signed out after cancellation');
  for (const timeout of [false, true]) {
    const survey = await kiosk({ authenticated: true, config: { postCallSurvey: true } }); await survey.start();
    survey.core.callStarted(); survey.core.callEnded(); await flush();
    assert.equal(survey.logouts, 1); assert.equal(survey.reloads, 0);
    assert.equal(survey.ui['survey-done'].hidden, false, 'Signed-out visitor can finish the retained survey');
    if (timeout) survey.fireTimer('surveyTimeoutMs'); else survey.ui['survey-done'].click();
    assert.equal(survey.reloads, 1); assert.equal(survey.ui['video-container'].children.length, 0);
  }
  const unexpectedLogout = await kiosk({ authenticated: true }); await unexpectedLogout.start();
  unexpectedLogout.loggedOut(); await flush(); failed(unexpectedLogout);
  assert.equal(unexpectedLogout.videoEnds, 1); assert.equal(unexpectedLogout.immediateEnds, 0);
  const staleOnReload = await kiosk({ authenticated: true, delayedEnd: true }); await staleOnReload.start(); await staleOnReload.end();
  assert.equal(staleOnReload.reloads, 1); assert.equal(staleOnReload.destroyCalls, 0); assert.equal(staleOnReload.videoEnds, 1);
  assert.equal(staleOnReload.immediateEnds, 1, 'Unload retains one best-effort request when SDK still reports an active conversation');
  for (const gate of ['endGate', 'logoutGate', 'hangupGate']) {
    const late = await kiosk({ authenticated: true, [gate]: deferred(), config: { postCallSurvey: gate === 'hangupGate' } });
    await late.start(); late.core.callStarted(); await late.end();
    late.fireTimer('endTimeoutMs'); await flush(); failed(late);
    const commands = () => [late.videoEnds, late.coreClearCalls, late.clearCalls, late.logouts, late.hangups, late.immediateEnds];
    const before = commands(); late[gate].resolve(); await flush();
    failed(late); assert.deepEqual(commands(), before, `Late ${gate} completion starts no further commands`);
    assert.equal(late.reloads, 0, 'Late command completion cannot restore or reload a failed session');
  }
}

const transactionKey = 'videoengager-kiosk-core-oidc';
function auth(search = '?auth=true', options = {}) {
  const storage = options.storage || new Map(), assigned = deferred();
  const assignedUrls = [];
  const location = { origin: 'https://kiosk.example', pathname: '/demo/', search, assign(url) { assignedUrls.push(url); assigned.resolve(url); } };
  const window = {
    isSecureContext: true, crypto: options.crypto || webcrypto, location,
    sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    history: { replaceState(_state, _title, url) { location.search = new URL(url).search; } }
  };
  runInNewContext(source('auth.js'), { window, document: { title: 'Kiosk' }, URL, URLSearchParams, TextEncoder, btoa });
  const createProvider = () => window.createKioskAuthProvider({ authorizationEndpoint: 'https://idp.example/authorize', clientId: 'public-client', scopes: ['openid', 'profile'], mode: options.mode || 'perInteraction', shouldStartAfterLogin: () => options.startAfterLogin !== false });
  return { window, provider: options.deferProvider ? undefined : createProvider(), storage, location, assigned, assignedUrls, createProvider };
}
async function signIn(fake, method = 'getAuthCode', request) {
  const url = new URL(await Promise.race([fake.assigned.promise, fake.provider[method](request)]));
  return { url, transaction: JSON.parse(fake.storage.get(transactionKey)) };
}
async function checkAuth() {
  const appSearch = '?env=production&waitingScreen=false&auth=true&postCallSurvey=true&chatMode=onActivity&chatMinimized=true';
  const fake = auth(appSearch), { url, transaction } = await signIn(fake);
  assert.equal(url.searchParams.get('response_type'), 'code'); assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('code_challenge'), createHash('sha256').update(transaction.codeVerifier).digest('base64url'));
  assert.match(transaction.codeVerifier, /^[A-Za-z0-9_-]{43,128}$/);
  assert.equal(url.searchParams.get('state'), transaction.state); assert.equal(url.searchParams.get('nonce'), transaction.nonce);
  assert.equal(url.searchParams.get('redirect_uri'), 'https://kiosk.example/demo/'); assert.equal(url.searchParams.has('client_secret'), false);
  assert.equal(url.searchParams.get('prompt'), 'login', 'Per-interaction authentication forces a fresh login');
  assert.equal(transaction.startAfterLogin, true);
  const callback = auth(`?code=one-use-code&state=${transaction.state}`, { storage: fake.storage });
  assert.equal(callback.provider.startAfterLogin, true);
  assert.equal(callback.provider.grantConsumed, false);
  const grant = await callback.provider.getAuthCode();
  assert.equal(callback.provider.grantConsumed, true);
  assert.equal(grant.authCode, 'one-use-code'); assert.equal(grant.codeVerifier, transaction.codeVerifier); assert.equal(grant.nonce, transaction.nonce);
  assert.equal(fake.storage.has(transactionKey), false);
  assert.equal(callback.location.search, appSearch, 'Callback restores configurator options without credentials');
  assert.throws(() => auth(`?code=one-use-code&state=${transaction.state}`, { storage: fake.storage }), /invalid/, 'Callback cannot be replayed');
  const second = await signIn(callback);
  assert.notEqual(second.transaction.state, transaction.state, 'Consumed callback grant is not returned a second time');
  const singleUse = auth(`?code=first-provider-only&state=${transaction.state}`, {
    storage: new Map([[transactionKey, JSON.stringify(transaction)]])
  });
  const laterProvider = singleUse.createProvider();
  assert.equal(laterProvider.startAfterLogin, false);
  await signIn({ ...singleUse, provider: laterProvider });
  assert.equal(laterProvider.grantConsumed, false, 'A later provider redirects instead of receiving the cached grant');
  assert.equal((await singleUse.provider.getAuthCode()).authCode, 'first-provider-only', 'Only the first provider receives the cached grant');
  for (const invalid of ['state', 'expired', 'future', 'redirect', 'verifier', 'nonce', 'appSearch', 'malformed', 'empty-code', 'duplicate-code', 'duplicate-state', 'denied']) {
    const bad = auth(), { transaction: stored } = await signIn(bad);
    if (invalid === 'expired') stored.createdAt = Date.now() - 601000;
    if (invalid === 'future') stored.createdAt = Date.now() + 60000;
    if (invalid === 'redirect') stored.redirectUri = 'https://other.example/demo/';
    if (invalid === 'verifier') delete stored.codeVerifier;
    if (invalid === 'nonce') delete stored.nonce;
    if (invalid === 'appSearch') delete stored.appSearch;
    bad.storage.set(transactionKey, invalid === 'malformed' ? '{invalid' : JSON.stringify(stored));
    let search = `?code=${invalid === 'empty-code' ? '%20' : 'test'}&state=${invalid === 'state' ? 'wrong' : stored.state}`;
    if (invalid === 'duplicate-code') search += '&code=second';
    if (invalid === 'duplicate-state') search += `&state=${stored.state}`;
    if (invalid === 'denied') search += '&error=access_denied';
    const invalidPage = auth(search, { storage: bad.storage, deferProvider: true });
    assert.ok(invalidPage.window.KIOSK_AUTH_ERROR, `${invalid} is rejected before provider creation`);
    assert.throws(invalidPage.createProvider, /invalid|expired|authorization code|denied/, invalid);
    const canRestore = ['expired', 'future', 'verifier', 'nonce', 'empty-code', 'duplicate-code', 'denied'].includes(invalid);
    assert.equal(bad.storage.has(transactionKey), false);
    assert.equal(invalidPage.location.search, canRestore ? '?auth=true' : '?error=invalid_callback');
    assert.equal(invalidPage.window.KIOSK_AUTH_REQUIRES_CONFIG, !canRestore);
  }
  assert.equal((await signIn(auth(), 'getAuthCode', { forceUpdate: true })).url.searchParams.get('prompt'), 'login');
  assert.equal((await signIn(auth(), 'reAuthenticate')).url.searchParams.get('prompt'), 'login');
  assert.equal((await signIn(auth('', { mode: 'shared' }))).url.searchParams.has('prompt'), false);
  const noIntent = auth('?auth=true', { startAfterLogin: false }), noIntentLogin = await signIn(noIntent);
  const noIntentCallback = auth(`?code=code&state=${noIntentLogin.transaction.state}`, { storage: noIntent.storage });
  assert.equal(noIntentCallback.provider.startAfterLogin, false);
  assert.equal(noIntentCallback.provider.grantConsumed, false);
  assert.equal((await noIntentCallback.provider.getAuthCode()).authCode, 'code', 'A callback without call intent keeps its grant available for a manual Start');
  assert.equal(noIntentCallback.provider.grantConsumed, true);
  const digest = deferred();
  const cancelled = auth('', { crypto: { getRandomValues: bytes => webcrypto.getRandomValues(bytes), subtle: { digest: () => digest.promise } } });
  const pending = cancelled.provider.getAuthCode(); cancelled.provider.cancel(); digest.resolve(new Uint8Array(32));
  await assert.rejects(pending, /cancelled/);
  assert.equal(cancelled.assignedUrls.length, 0, 'Cancel during PKCE generation prevents a late redirect');
  assert.equal(cancelled.storage.has(transactionKey), false);
  assert.throws(() => auth().window.createKioskAuthProvider({ authorizationEndpoint: 'http://idp.example/authorize', clientId: 'client', scopes: ['openid'] }), /HTTPS/);
}

function checkConfig() {
  const window = readConfig(), api = window.KioskConfig;
  assert.equal(api.read('?genesysDomain=euw2.pure.cloud').genesys.domain, 'euw2.pure.cloud', 'Regions outside kiosk presets come from the SDK mapping');
  assert.equal(api.genesysDomains.filter(domain => domain === 'inindca.com').length, 1, 'Duplicate SDK region hosts appear once');
  for (const mapping of [null, {}]) {
    const unavailable = readConfig('', new Map(), true, mapping);
    assert.equal(unavailable.KIOSK_CONFIG, undefined, 'Missing SDK domains must not enable arbitrary hosts');
    assert.match(unavailable.KIOSK_CONFIG_ERROR, /SDK|domain/i);
  }
  assert.equal(window.KIOSK_CONFIG.environment, 'production');
  assert.equal(window.KIOSK_CONFIG.auth.mode, 'perInteraction');
  assert.equal(window.KIOSK_CONFIG.waitingScreenMode, 'overlay');
  assert.equal(window.KIOSK_CONFIG.chatMode, 'hidden'); assert.equal(window.KIOSK_CONFIG.chatMinimized, false);
  for (const chatMode of ['hidden', 'onActivity', 'always', 'afterStart']) {
    for (const chatMinimized of [false, true]) {
      const chat = api.read(`?chatMode=${chatMode}&chatMinimized=${chatMinimized}`);
      assert.equal(chat.chatMode, chatMode); assert.equal(chat.chatMinimized, chatMinimized);
      assert.deepEqual(api.read(api.toSearch(chat)), chat);
    }
  }
  const beside = api.read('?waitingScreenMode=beside');
  assert.equal(beside.waitingScreenMode, 'beside'); assert.deepEqual(api.read(api.toSearch(beside)), beside);
  assert.equal(api.read('?auth=true&authMode=shared').auth.mode, 'shared');
  for (const [environment, preset] of Object.entries(api.presets)) {
    const config = api.read(`?env=${environment}`);
    assert.equal(config.videoEngager.veEnv, preset.videoEngager.veEnv);
    assert.equal(config.genesys.deploymentId, preset.genesys.deploymentId);
    assert.deepEqual(api.read(api.toSearch(config)), config, 'Configurator link round trips exactly');
  }
  const config = api.read('?env=production&auth=true&waitingScreen=false&postCallSurvey=true&cleanupOnUnload=false&kioskId=Lobby%20A&maxWaitMs=45000&endTimeoutMs=5000&surveyTimeoutMs=15000');
  assert.equal(config.genesys.deploymentId, api.presets.production.authenticatedDeploymentId);
  assert.equal(config.waitingScreen, false); assert.equal(config.postCallSurvey, true); assert.equal(config.cleanupOnUnload, false);
  assert.equal(config.kioskId, 'Lobby A'); assert.equal(config.maxWaitMs, 45000);
  assert.deepEqual(api.read(api.toSearch(config)), config);
  assert.equal(api.read(`?env=dev&auth=true&genesysDeploymentId=${api.presets.production.authenticatedDeploymentId}`).auth.enabled, true);
  for (const query of [
    'env=missing', 'env=__proto__', 'env=dev&env=uae', 'auth=yes', 'authMode=unknown', 'authMode=shared&authMode=perInteraction', 'waitingScreen=1', 'postCallSurvey=',
    'cleanupOnUnload=no', 'chatMode=unknown', 'chatMode=always&chatMode=hidden', 'chatMinimized=1', 'chatMinimized=true&chatMinimized=false',
    'waitingScreenMode=unknown', 'waitingScreenMode=overlay&waitingScreenMode=beside', 'kioskId=', 'kioskId=%0A', 'veDomain=https://example.com', 'veDomain=example.com/path',
    'genesysDomain=user@example.com', 'genesysDomain=attacker.example', 'genesysDomain=mypurecloud.com.attacker.example', 'veTenantId=%3Cscript%3E', 'genesysDeploymentId=invalid',
    'maxWaitMs=999', 'maxWaitMs=3600001', 'endTimeoutMs=60001', 'surveyTimeoutMs=4999', 'maxWaitMs=1.5',
    'endTimeoutMs=1000&endTimeoutMs=2000', 'env=dev&auth=true', 'authorizationEndpoint=http://idp.example/auth',
    'authorizationEndpoint=https://user:secret@idp.example/auth', 'authorizationEndpoint=https://idp.example/auth?secret=x',
    'authorizationEndpoint=https://idp.example/auth%23fragment', 'clientId=', 'scopes=profile'
  ]) assert.throws(() => api.read(query), undefined, `Reject invalid configuration: ${query}`);
  assert.ok(readConfig('?waitingScreen=maybe').KIOSK_CONFIG_ERROR, 'Bad direct links report configuration errors');
  const appSearch = '?env=production&auth=true&kioskId=Authenticated-Lobby&waitingScreen=false&postCallSurvey=true&chatMode=afterStart&chatMinimized=true';
  const transaction = { state: 'expected', codeVerifier: 'verifier', nonce: 'nonce', startAfterLogin: true, redirectUri: 'https://kiosk.example/demo/index.html', createdAt: Date.now(), appSearch };
  const storage = new Map([[transactionKey, JSON.stringify(transaction)]]);
  const callback = readConfig('?code=temporary&state=expected', storage);
  assert.equal(callback.KIOSK_CONFIG.auth.enabled, true, 'Callback restores auth configuration before initialization');
  assert.equal(callback.KIOSK_CONFIG.waitingScreen, false);
  assert.equal(callback.KIOSK_CONFIG.postCallSurvey, true);
  assert.equal(callback.KIOSK_CONFIG.chatMode, 'afterStart'); assert.equal(callback.KIOSK_CONFIG.chatMinimized, true);
  assert.equal(storage.has(transactionKey), false, 'Bootstrap consumes the transaction before reading configuration');
  assert.equal(callback.location.search, appSearch);
  const provider = callback.createKioskAuthProvider(callback.KIOSK_CONFIG.auth);
  assert.equal(provider.grantConsumed, false);
  assert.equal(provider.startAfterLogin, true, 'The provider receives call intent after configuration is restored');
  assert.ok(readConfig('?code=temporary&state=expected', new Map(), false).KIOSK_CONFIG_ERROR, 'Config without auth bootstrap rejects raw callbacks');
  for (const appSearch of ['', '?auth=false']) {
    const anonymous = readConfig('?code=temporary&state=expected', new Map([[transactionKey, JSON.stringify({ ...transaction, appSearch })]]));
    assert.equal(anonymous.KIOSK_CONFIG, undefined, 'A valid callback cannot silently initialize an anonymous kiosk');
    assert.match(anonymous.KIOSK_CONFIG_ERROR, /Reopen the kiosk configuration/);
    assert.equal(anonymous.KIOSK_AUTH_REQUIRES_CONFIG, true);
  }
  for (const changed of [{ state: 'wrong' }, { createdAt: Date.now() - 601000 }, { createdAt: Date.now() + 60000 }, { redirectUri: 'https://other.example' }]) {
    const invalidStorage = new Map([[transactionKey, JSON.stringify({ ...transaction, ...changed })]]);
    const invalid = readConfig('?code=temporary&state=expected', invalidStorage);
    assert.ok(invalid.KIOSK_CONFIG_ERROR);
    const canRestore = Object.hasOwn(changed, 'createdAt');
    assert.equal(invalid.location.search, canRestore ? appSearch : '?error=invalid_callback');
    assert.equal(invalid.KIOSK_AUTH_REQUIRES_CONFIG, !canRestore);
    assert.equal(invalidStorage.has(transactionKey), false, 'Invalid callback drops the OIDC transaction');
    const reloaded = readConfig(invalid.location.search, invalidStorage);
    if (canRestore) {
      assert.equal(reloaded.KIOSK_CONFIG.auth.enabled, true, 'Retrying expired authentication never changes to anonymous mode');
      assert.equal(reloaded.KIOSK_CONFIG.kioskId, 'Authenticated-Lobby');
      assert.equal(reloaded.KIOSK_CONFIG.chatMode, 'afterStart');
      assert.equal(reloaded.createKioskAuthProvider(reloaded.KIOSK_CONFIG.auth).startAfterLogin, false, 'The rejected grant cannot automatically start a call after reload');
    } else {
      assert.equal(reloaded.KIOSK_CONFIG, undefined, 'Even browser Reload cannot turn an invalid callback into an anonymous kiosk');
      assert.equal(reloaded.KIOSK_AUTH_REQUIRES_CONFIG, true);
    }
  }
}

(async () => {
  checkConfig();
  await checkConversationClearing();
  await checkKiosk();
  await checkCoreLifecycle();
  await checkWaitingModes();
  await checkWaitingCarousel();
  await checkFullscreen();
  await checkChatController();
  await checkChat();
  await checkAuthenticatedKiosk();
  await checkAuth();
  console.log('Kiosk lifecycle, UI, configuration and OIDC checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
