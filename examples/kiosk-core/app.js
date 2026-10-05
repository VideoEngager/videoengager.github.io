// Session orchestration only. Rendering is in ui.js, waiting-screen.js and chat-ui.js.
(() => {
  const config = window.KIOSK_CONFIG;
  const ui = window.createKioskUI(config || {});
  const chat = window.createKioskChat();
  chat.hide();
  const perVisitor = config?.auth.enabled && config.auth.mode === 'perInteraction';
  let veWidgetCore;
  let authProvider;
  let integrationReady = false;
  let signingOut = false;
  let loggedOut = false;
  let logoutPromise;
  let phase = 'loading';
  let pendingAuthentication;
  let pendingStart;
  let waitTimer;
  let surveyTimer;
  let hasConnected = false;
  let conversationNeedsClear = false;
  let hangupReported = false;
  let unloading = false;
  let chatPaused = true;
  let chatRequested = false;
  let chatCommand;

  function show (next, message) {
    phase = next;
    ui.show(next, message, !pendingStart && ['waiting', 'active'].includes(next));
    if (next === 'ending' || next === 'ready') chatRequested = false;
    if (next === 'ready') chatCommand = null;
    updateChat();
  }

  // Chat policy belongs to the app; chat-ui.js only performs presentation actions.
  function updateChat () {
    const visible = !chatPaused && (config?.chatMode === 'always' || chatRequested) &&
      ['ready', 'starting', 'waiting', 'active', 'survey'].includes(phase);
    if (!visible) { chat.hide(); return; }
    chat.show();
    // Apply the preference once per visitor, preserving later manual toggles.
    if (integrationReady && !chatCommand) chatCommand = config.chatMinimized ? chat.minimize() : chat.open();
  }

  function pauseChat () {
    chatPaused = true;
    chat.hide();
    // ponytail: this drains kiosk-owned commands; SDK background work needs a public idle signal.
    return chatCommand || Promise.resolve();
  }

  function resumeChat () {
    chatPaused = false;
    updateChat();
  }

  // 1. Initialize and start a visitor session.
  async function initialize () {
    if (window.KIOSK_CONFIG_ERROR) throw new Error(window.KIOSK_CONFIG_ERROR);
    if (!window.isSecureContext) throw new Error('Serve this kiosk over HTTPS or localhost.');
    if (!navigator.onLine) throw new Error('The kiosk is offline. Restore the connection, then reload.');
    if (config.auth.enabled) {
      authProvider = window.createKioskAuthProvider({
        ...config.auth,
        onStatus: ui.setStatus,
        shouldStartAfterLogin: () => phase === 'authenticating'
      });
      show('ready', 'Touch here to sign in and begin.');
      // Continue a visitor's Start request after login; other sign-ins stay on welcome.
      if (authProvider.startAfterLogin) await startSession();
      return;
    }
    await initializeCore();
    if (phase === 'error') return;
    if (veWidgetCore.contactCenterInActiveInteraction || conversationNeedsClear) await finishSession();
    else {
      show('ready', 'Ready when you are.');
      resumeChat();
    }
  }

  async function initializeCore () {
    await pauseChat();
    const { VideoEngagerCore, GenesysIntegration } = window.VideoEngager || {};
    if (!VideoEngagerCore || !GenesysIntegration) throw new Error('The VideoEngager SDK did not load. Check the script URL and connection.');
    // Initialize VideoEngagegr Widget Core lib
    veWidgetCore = new VideoEngagerCore({ ...config.videoEngager, logger: true, enableVeIframeCommands: true });
    // Initialize Genesys Integration
    const genesysIntegration = new GenesysIntegration({ ...config.genesys, logger: true, hideUIOnBusyOperation: true, ...(authProvider && { authProvider }) });
    // Set UI callback so VideoEngager can bind the ve widget into your iframes
    veWidgetCore.setUiCallbacks({
      ...ui.callbacks
    });
    // listen to videoEngager Core Events
    listenToCore();
    // Do not issue interaction or Messenger commands until this promise resolves.
    await veWidgetCore.setContactCenterIntegration(genesysIntegration);
    integrationReady = true;
    if (phase === 'error' && perVisitor) {
      // Sign-in may finish after cancellation timed out. Sign out that late identity.
      withinDeadline(logoutVisitor, config.endTimeoutMs).catch(() => {});
    }
  }

  async function prepareAuthenticatedSession () {
    await initializeCore();
    if (phase !== 'authenticating') return;
    // A saved Messenger login can skip getAuthCode. Never use it for a new visitor.
    if (perVisitor && !authProvider.grantConsumed) {
      await withinDeadline(async signal => {
        await endInteraction(signal);
        await logoutVisitor(signal);
      }, config.endTimeoutMs);
      if (phase !== 'authenticating') return;
      await authProvider.reAuthenticate(); // Fresh PKCE redirect; the callback uses a new SDK instance.
    }
    // A freshly authenticated visitor may still have a restored conversation.
    if (veWidgetCore.contactCenterInActiveInteraction || conversationNeedsClear) {
      await withinDeadline(endInteraction, config.endTimeoutMs);
    }
  }

  async function startSession () {
    if (phase !== 'ready') return;
    if (config.auth.enabled && !integrationReady) {
      show('authenticating', 'Signing in before starting your call…');
      pendingAuthentication = prepareAuthenticatedSession();
      try {
        await pendingAuthentication;
      } catch (error) {
        pendingAuthentication = null;
        if (phase !== 'ending' && phase !== 'error') {
          await finishSession({ failed: true, message: error.message || 'Sign-in failed. Please reload.' });
        }
        return;
      }
      pendingAuthentication = null;
      if (phase !== 'authenticating') return;
      show('ready', 'Signed in. Starting your call…');
    }
    hasConnected = false;
    hangupReported = false;
    show('starting', 'Connecting to our team…');
    waitTimer = setTimeout(() => {
      finishSession({ message: 'No agent connected in time. Please try again.' });
    }, config.maxWaitMs);
    try {
      await pauseChat();
      if (phase !== 'starting' || unloading) return;
      // Check immediately before Core starts.
      if (veWidgetCore.contactCenterInActiveInteraction || veWidgetCore.isCallOngoing || conversationNeedsClear) {
        await finishSession({ message: 'Touch here to begin again.' });
        return;
      }
      pendingStart = veWidgetCore.startVideoEngagerInteraction({
        bindToOrStartContactCenterInteraction: true,
        callConfigs: { isPopup: false },
        customAttributes: { 'context.kioskId': config.kioskId }
      });
      await pendingStart;
    } catch {
      pendingStart = null;
      if (phase !== 'ending' && phase !== 'error') {
        await finishSession({ message: 'We could not start the call. Please reload and try again.', failed: true });
      }
      return;
    }
    pendingStart = null;
    if (phase === 'starting') show('waiting', 'Waiting for an agent…');
    // A connected event can arrive before startup resolves; enable End only now.
    else if (phase === 'active') show('active', 'You’re connected.');
    if (!unloading && ['waiting', 'active'].includes(phase)) {
      if (config.chatMode === 'afterStart') chatRequested = true;
      resumeChat();
    }
  }

  // 2. Translate SDK events into kiosk phases.
  function listenToCore () {
    veWidgetCore.on('integration:raw-message', message => {
      if (config.chatMode !== 'onActivity' || !['starting', 'waiting', 'active'].includes(phase)) return;
      // Core provides formatted messages, including history. Outbound means sent to the visitor.
      if (message?.messageType !== 'outbound' || message.type === 'event') return;
      chatRequested = true;
      updateChat();
    });
    veWidgetCore.on('videoEngager:call-state-changed', state => {
      if (state === 'active' && ['starting', 'waiting'].includes(phase)) {
        hasConnected = true;
        clearTimeout(waitTimer);
        ui.setSurveyRetention(config.postCallSurvey);
        show('active', 'You’re connected.');
        if (config.chatMode === 'onActivity') {
          chatRequested = true;
          updateChat();
        }
      } else if (state === 'ended') onCallEnded();
      else if (state === 'idle') handleSessionEnded();
    });
    veWidgetCore.on('videoEngager:active-ve-instance', active => {
      if (!active) handleSessionEnded(); // Covers closure even when CallEnded is absent.
    });
    veWidgetCore.on('videoEngager:CallEnded', onCallEnded); // Keep support when the upstream bug is fixed.
    veWidgetCore.on('videoEngager:PopupClosed', () => {
      // This also fires on navigation to the survey. Keep the iframe and avoid a second hangup.
      hangupReported = true;
    });
    veWidgetCore.on('integration:sessionEnded', handleSessionEnded);
    veWidgetCore.on('integration:sessionStarted', () => {
      conversationNeedsClear = true; // Remember the session even after agent disconnect.
    });
    veWidgetCore.on('error:catchAll', error => {
      // This stream includes recovered timeouts. Awaited API rejections handle operation failures.
      const terminalAuthEvents = ['Auth.authError', 'Auth.authProviderError', 'Auth.tokenError', 'Auth.loggedOut'];
      if (error?.context?.authEvent === 'Auth.loggedOut') {
        loggedOut = true;
        if (signingOut) return; // The SDK reports even an intentional logout on catchAll.
      }
      if (terminalAuthEvents.includes(error?.context?.authEvent) && phase !== 'loading' && phase !== 'error') {
        const message = 'Authentication ended. Reload the kiosk to sign in again.';
        if (phase === 'ending') failSession(message);
        else finishSession({ failed: true, message });
      }
    });
  }

  function handleSessionEnded () {
    if (['starting', 'waiting', 'active'].includes(phase)) {
      // Core may close its logical instance while our callbacks retain the survey iframe.
      finishSession({ hangup: hasConnected && !hangupReported });
    }
  }

  function onCallEnded () {
    hangupReported = true;
    handleSessionEnded();
  }

  // 3. End the session, then show a survey or welcome the next visitor.
  async function finishSession ({ message = 'Ready for your next call.', failed = false, hangup = false } = {}) {
    if (phase === 'error' || phase === 'ending') return;
    clearTimeout(waitTimer);
    if (perVisitor || phase === 'authenticating') authProvider?.cancel();
    const keepSurvey = config.postCallSurvey && hasConnected && ui.hasIframe() && !failed;
    ui.setSurveyRetention(keepSurvey);
    show('ending', 'Ending your session…');
    // Enter 'ending' before calling Core, so its synchronous end events cannot start cleanup again.
    try {
      await withinDeadline(async signal => {
        await pauseChat();
        // Authentication setup is outside Core's start/end operation queue.
        await pendingAuthentication?.catch(() => {});
        signal.throwIfAborted();
        if (hangup && keepSurvey && !hangupReported) {
          // Hang up inside the video app so it can display its configured survey.
          await veWidgetCore.executeVideoCallFn('triggerHangup');
          // CallEnded is currently missing in some video apps. Do not wait for it.
        }
        await endInteraction(signal);
        await logoutVisitor(signal);
      }, config.endTimeoutMs);
      if (phase === 'error') return;
      if (failed) {
        failSession(message);
      } else if (keepSurvey && ui.hasIframe()) {
        show('survey', 'Thank you. Complete the survey, or finish to return to the welcome screen.');
        if (!perVisitor && !unloading) resumeChat();
        surveyTimer = setTimeout(finishSurvey, config.surveyTimeoutMs);
      } else {
        hasConnected = false;
        if (perVisitor) reloadKiosk();
        else {
          show('ready', message);
          if (!unloading) resumeChat();
        }
      }
    } catch {
      failSession('The session could not be cleared. Please reload before another call.');
    }
  }

  async function endInteraction (signal) {
    signal.throwIfAborted();
    if (!veWidgetCore) return;
    // Core owns startup sequencing, video closure and the contact-center end attempt.
    await veWidgetCore.endVideoEngagerInteraction(true);
    signal.throwIfAborted();
    conversationNeedsClear = false;
  }

  function logoutVisitor (signal) {
    signal.throwIfAborted();
    if (!perVisitor || !integrationReady || loggedOut) return Promise.resolve();
    if (logoutPromise) return logoutPromise;
    signingOut = true;
    if (phase !== 'error') ui.setStatus('Signing out…');
    // Core has no logout API. Use Messenger's command result.
    logoutPromise = pauseChat().then(() => {
      signal.throwIfAborted();
      return new Promise((resolve, reject) => window.Genesys('command', 'Auth.logout', {}, resolve, reject));
    })
      .then(() => { loggedOut = true; });
    return logoutPromise;
  }

  function finishSurvey () {
    if (phase !== 'survey') return;
    clearTimeout(surveyTimer);
    hasConnected = false;
    if (perVisitor) {
      ui.setSurveyRetention(false);
      ui.removeIframe();
      show('ending', 'Thank you. Preparing for the next visitor…');
      reloadKiosk();
    } else {
      show('ready', 'Thank you. Ready for your next call.');
      if (!unloading) resumeChat();
    }
  }

  // Recovery and page-exit safeguards.
  function failSession (message) {
    if (phase === 'error') return; // Core and Genesys can forward the same error more than once.
    clearTimeout(waitTimer);
    clearTimeout(surveyTimer);
    show('error', message);
    pauseChat();
    ui.setSurveyRetention(false);
    ui.removeIframe();
    authProvider?.cancel();
  }

  // Bounds our wait; the signal prevents further commands after a timeout, not an SDK command already running.
  async function withinDeadline (work, milliseconds) {
    const controller = new AbortController();
    let timer;
    try {
      return await Promise.race([
        work(controller.signal),
        new Promise((_resolve, reject) => {
          timer = setTimeout(() => {
            const error = new Error('Session cleanup timed out. Reload the kiosk before another call.');
            controller.abort(error);
            reject(error);
          }, milliseconds);
        })
      ]);
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
  }

  function reloadKiosk () {
    authProvider?.cancel();
    if (window.KIOSK_AUTH_REQUIRES_CONFIG) {
      window.location.assign('configurator.html');
      return;
    }
    // Genesys' AuthProvider is registered once per page; a new identity needs a reload.
    window.location.reload();
  }

  function onUnload () {
    if (unloading) return;
    unloading = true;
    pauseChat();
    if (!config?.cleanupOnUnload) return;
    if (pendingAuthentication || pendingStart || veWidgetCore?.contactCenterInActiveInteraction || veWidgetCore?.isCallOngoing) {
      try { veWidgetCore?._expiremental_immedieteEndContactCenterInteraction(); } catch { /* Best effort on page exit. */ }
    }
    if (perVisitor && integrationReady && !signingOut && !loggedOut && !authProvider?.isRedirecting) {
      signingOut = true;
      try { window.Genesys('command', 'Auth.logout', {}, () => {}, () => {}); } catch { /* Best effort on page exit. */ }
    }
  }

  ui.onStart(startSession);
  ui.onEnd(() => { finishSession({ hangup: hasConnected }); });
  ui.onSurveyDone(finishSurvey);
  ui.onRetry(reloadKiosk, window.KIOSK_AUTH_REQUIRES_CONFIG ? 'Configure kiosk' : 'Reload kiosk');
  window.addEventListener('offline', () => {
    if (phase === 'error') return;
    const message = 'The kiosk is offline. Restore the connection, then reload.';
    if (phase === 'ending') failSession(message);
    else finishSession({ failed: true, message });
  });
  window.addEventListener('beforeunload', onUnload);
  window.addEventListener('pagehide', onUnload);
  window.addEventListener('pageshow', event => {
    if (event.persisted) window.location.reload();
  });
  initialize().catch(error => { failSession(error.message || 'Kiosk initialization failed. Please reload.'); });
})();
