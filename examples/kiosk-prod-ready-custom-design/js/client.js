// @ts-check
/// <reference types="../types/ve-window.d.ts" />
import { ErrorHandler, ErrorTypes } from './error-handler.js';
import { Utils } from './utils.js';
import { createKioskAuthProvider, saveConfigForReload } from './auth.js';

// Core adapter: keep the kiosk's existing methods and event names.
export class VideoEngagerClient {
  constructor (config) {
    this.config = this.validateAndSanitizeConfig(config);
    this.errorHandler = new ErrorHandler();
    this.eventEmitter = new EventTarget();
    this.connectionState = 'disconnected';
    this.retryCount = 0;
    this.core = null;
    this.authProvider = null;
    this.readyPromise = null;
    this.integrationReady = false;
    this.startPromise = null;
    this.chatCommand = null;
    this.starting = false;
    this.sessionActive = false;
    this.videoActive = false;
  }

  validateAndSanitizeConfig (config) {
    if (!config || typeof config !== 'object') throw new Error('Configuration is required');
    for (const [section, fields] of Object.entries({ videoEngager: ['tenantId', 'veEnv'], genesys: ['deploymentId', 'domain'] })) {
      for (const field of fields) {
        if (!config[section]?.[field]) throw new Error(`Missing required field: ${section}.${field}`);
      }
    }
    const result = JSON.parse(JSON.stringify(config));
    if (!/^[\w.-]+$/.test(result.videoEngager.veEnv)) throw new Error('Invalid VideoEngager hostname');
    if (result.auth !== undefined && (!result.auth || typeof result.auth !== 'object' || Array.isArray(result.auth))) {
      throw new Error('Authentication configuration must be an object.');
    }
    result.auth = { enabled: false, mode: 'perInteraction', scopes: ['openid', 'profile', 'email'], ...result.auth };
    if (typeof result.auth.enabled !== 'boolean' || !['perInteraction', 'shared'].includes(result.auth.mode)) {
      throw new Error('Use auth=true/false and authMode=perInteraction/shared.');
    }
    return result;
  }

  get perVisitor () { return this.config.auth.enabled && this.config.auth.mode === 'perInteraction'; }
  get startAfterLogin () { return this.authProvider?.startAfterLogin === true; }

  async init () {
    try {
      this.connectionState = 'connecting';
      await this.loadDependencies();
      const { VideoEngagerCore, GenesysIntegration, gensysPureDomainsMapping } = window.VideoEngager;
      if (!Object.values(gensysPureDomainsMapping || {}).includes(this.config.genesys.domain)) {
        throw new Error('Choose a Genesys domain supported by the loaded VideoEngager SDK.');
      }
      if (this.config.auth.enabled) {
        this.authProvider = createKioskAuthProvider({
          ...this.config.auth,
          config: this.config,
          shouldStartAfterLogin: () => this.starting
        });
      }
      this.core = new VideoEngagerCore({
        ...this.config.videoEngager,
        logger: this.config.debug === true,
        // Popup mode does not use the iframe command handshake.
        enableVeIframeCommands: !this.config.videoEngager.isPopup
      });
      this.integration = new GenesysIntegration({
        ...this.config.genesys,
        logger: this.config.debug === true,
        hideUIOnBusyOperation: true,
        ...(this.authProvider && { authProvider: this.authProvider })
      });
      const container = document.getElementById('video-call-ui');
      if (!container) throw new Error('The video-call-ui container is missing.');
      this.core.setUiCallbacks({
        createIframe: src => {
          const iframe = document.createElement('iframe');
          iframe.id = 'videoengageriframe';
          iframe.className = 'videoengager-widget-iframe';
          iframe.title = 'VideoEngager Chat';
          iframe.allow = 'camera; microphone; autoplay; fullscreen; display-capture';
          iframe.style.cssText = 'width:100%;height:100%;border:0;border-radius:8px';
          iframe.src = src;
          container.style.height = 'calc(100dvh - 38px)';
          container.replaceChildren(iframe);
          return iframe;
        },
        getIframeInstance: () => container.querySelector('iframe'),
        destroyIframe: () => { container.replaceChildren(); container.style.height = '0'; },
        setIframeVisibility: visible => { container.hidden = !visible; }
      });
      this.setupEventListeners();
      // Messenger loads even for video-only kiosks. Preserve the previous chat settings.
      this.chatStyle = document.createElement('style');
      this.chatStyle.textContent = !this.config.useGenesysMessengerChat
        ? '#genesys-messenger, #genesys-mxg-container-frame, #genesys-mxg-frame { display:none !important; }'
        : this.config.genesys.hideGenesysLauncher ? '.genesys-mxg-launcher-frame { display:none !important; }' : '';
      document.head.appendChild(this.chatStyle);
      // Authenticated kiosks stay on welcome until Start is pressed.
      if (!this.authProvider) await this.waitForReady();
      this.connectionState = 'connected';
      this.retryCount = 0;
      this.emit('client:ready', {});
      return true;
    } catch (error) {
      this.connectionState = 'error';
      this.handleInitError(error);
      throw error;
    }
  }

  async loadDependencies () {
    if (window.VideoEngager?.VideoEngagerCore && window.VideoEngager?.GenesysIntegration) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.videoengager.com/widget/latest/browser/main.umd.js';
      script.async = true;
      const timeout = setTimeout(() => finish(new Error('VideoEngager script load timeout')), 15000);
      const finish = error => {
        clearTimeout(timeout);
        script.onload = script.onerror = null;
        if (error) { script.remove(); reject(error); } else resolve();
      };
      script.onload = () => finish(window.VideoEngager?.VideoEngagerCore && window.VideoEngager?.GenesysIntegration
        ? null : new Error('VideoEngager Core SDK did not load'));
      script.onerror = () => finish(new Error('Failed to load VideoEngager script'));
      document.head.appendChild(script);
    });
  }

  async waitForReady () {
    if (!this.core) throw new Error('Client not ready. Call init() first.');
    if (!this.readyPromise) this.readyPromise = this.initializeIntegration();
    await this.readyPromise;
  }

  async initializeIntegration () {
    // Do not send interaction or Messenger commands before this resolves.
    await this.core.setContactCenterIntegration(this.integration);
    this.integrationReady = true;
    // A saved Messenger identity may bypass getAuthCode; require a fresh visitor login.
    if (this.perVisitor && !this.authProvider.grantConsumed) {
      await this.core.endVideoEngagerInteraction(false);
      await this.genesysCommand('MessagingService.clearConversation');
      await this.genesysCommand('Auth.logout');
      await this.authProvider.reAuthenticate();
    }
    if (this.core.contactCenterInActiveInteraction) {
      await this.core.endVideoEngagerInteraction(false);
      await this.genesysCommand('MessagingService.clearConversation');
    }
  }

  setupEventListeners () {
    this.core.on('videoEngager:active-ve-instance', active => {
      if (active) {
        if (!this.sessionActive) return;
        this.videoActive = true;
        this.emit('VideoEngagerCall.started', {});
      } else this.emitVideoEnded();
    });
    this.core.on('videoEngager:call-state-changed', state => {
      if (state === 'active' && this.sessionActive) {
        this.videoActive = true;
        this.emit('VideoEngagerCall.agentJoined', {});
      }
      else if (state === 'ended' || state === 'idle') this.emitVideoEnded();
    });
    this.core.on('videoEngager:CallEnded', () => this.emitVideoEnded());
    for (const [source, target] of Object.entries({
      'integration:sessionStarted': 'GenesysMessenger.conversationStarted',
      'integration:sessionEnded': 'GenesysMessenger.conversationEnded'
    })) {
      this.core.on(source, () => { if (this.sessionActive) this.emit(target, {}); });
    }
    this.core.on('integration:raw-message', message => {
      if (!this.sessionActive) return;
      const normalized = this.normalizeGenesysMessage(message);
      if (normalized) this.emit('onMessage', { message: normalized });
    });
    this.core.on('error:catchAll', error => {
      // Recovered SDK timeouts are diagnostics; awaited methods report operation failures.
      if (this.sessionActive && ['Auth.authError', 'Auth.authProviderError', 'Auth.tokenError', 'Auth.loggedOut'].includes(error?.context?.authEvent)) {
        this.emit('GenesysChat.error', { error });
      }
    });
  }

  normalizeGenesysMessage (message) {
    let content;
    if (message.type === 'event') {
      const presence = { Join: 'Joined', Disconnect: 'Ended', Clear: 'Ended' }[message.presence?.type];
      if (message.eventType !== 'Presence' || !presence) return null;
      content = { type: 'NotificationPresence', presence };
    } else if (message.type === 'text' || message.type === 'structured') {
      if (message.files?.length) {
        content = { type: 'Attachment', attachments: message.files.map(file => ({
          id: file.id,
          type: ({ Image: 'image', Video: 'video', Audio: 'audio', File: 'file', Link: 'link' })[file.type] || 'unknown',
          name: file.name, size: file.size, url: file.downloadUrl, mime: file.mime
        })) };
        if (message.text) content.text = message.text;
      } else if (message.text) {
        const domain = this.config.videoEngager.veEnv.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const url = message.text.match(new RegExp('https://' + domain + '/ve/\\S+'))?.[0].replace(/[.,;:!?)]+$/, '');
        content = url ? { type: 'videoEngagerUrl', url, text: message.text.replace(url, '').trim() }
          : { type: 'Text', text: message.text };
      } else if (message.type === 'structured') {
        content = { type: 'Error', text: 'Unsupported message format' };
      } else return null;
    } else return null;
    const from = message.from || {};
    const name = message.messageType === 'inbound' ? (from.nickname || from.name || 'You')
      : (from.firstName || from.lastName) ? `${from.firstName || ''} ${from.lastName || ''}`.trim()
        : from.nickname || from.name || (message.originatingEntity === 'Bot' ? 'Bot' : 'Agent');
    return {
      id: message.id,
      // Genesys outbound means inbound to the visitor in the previous Hub's payload.
      direction: message.messageType === 'outbound' ? 'Inbound' : 'Outbound',
      sender: { name, image: from.image ?? from.avatar },
      timestamp: new Date(message.timestamp || message.time || Date.now()).toISOString(),
      content
    };
  }

  emitVideoEnded () {
    if (!this.videoActive) return;
    this.videoActive = false;
    this.emit('VideoEngagerCall.ended', {});
  }

  async startVideo () {
    if (!this.isReady()) throw new Error('Client not ready. Call init() first.');
    this.starting = true;
    try {
      await this.waitForReady();
      await this.chatCommand;
      this.sessionActive = true;
      this.startPromise = this.core.startVideoEngagerInteraction({
        bindToOrStartContactCenterInteraction: true,
        callConfigs: { isPopup: Boolean(this.config.videoEngager.isPopup), autoAccept: true }
      });
      const result = await this.startPromise;
      this.emit('video:started', result);
      return result;
    } catch (error) {
      this.connectionState = 'error';
      this.emit('VideoEngagerCall.error', { error });
      this.emit('video:error', { error });
      throw error;
    } finally {
      this.starting = false;
      this.startPromise = null;
    }
  }

  async endVideo () {
    if (!this.integrationReady) return;
    try {
      await this.chatCommand?.catch(() => {}); // Appearance failures must not block ending the call.
      // Clear explicitly because Core can skip contact-center cleanup after agent disconnect.
      const result = await this.core.endVideoEngagerInteraction(false);
      await this.genesysCommand('MessagingService.clearConversation');
      this.sessionActive = false;
      if (this.perVisitor) {
        await this.genesysCommand('Auth.logout');
        this.authProvider.cancel();
        this.connectionState = 'disconnected';
        saveConfigForReload(this.config);
        window.location.reload();
      } else {
        this.connectionState = 'connected';
      }
      this.emit('video:ended', result);
      return result;
    } catch (error) {
      this.connectionState = 'error';
      this.emit('video:error', { error });
      throw error;
    }
  }

  genesysCommand (name) {
    // Reuse the integration's public command wrapper and its timeout.
    return this.integration.genesysJsSdkWrapper.command(name);
  }

  async startGenesysChat () {
    await this.waitForReady();
    await this.startPromise;
    if (this.sessionActive && !this.core.contactCenterInActiveInteraction) return;
    if (!this.core.contactCenterInActiveInteraction) {
      this.sessionActive = true;
      await this.core.startContactCenterInteraction();
    }
    await this.chatCommand;
    this.chatCommand = this.genesysCommand('Messenger.open').catch(error => {
      if ((error?.message || error) !== 'Messenger is already opened.') console.warn('Could not open Messenger:', error);
    });
    return this.chatCommand;
  }

  async hideGenesysChat () {
    try {
      await this.startPromise;
      if (!this.integrationReady) return;
      await this.chatCommand;
      this.chatCommand = this.genesysCommand('Messenger.close').catch(error => {
        if ((error?.message || error) !== 'Messenger is already closed.') console.warn('Could not minimize Messenger:', error);
      });
      await this.chatCommand;
    } catch (error) { console.warn('Could not minimize Messenger:', error); }
  }

  async endGenesysChat () {
    return this.endVideo();
  }

  async startChat () {
    try {
      const result = await this.startGenesysChat();
      this.emit('chat:started', result);
      return result;
    } catch (error) { this.emit('chat:error', { error }); throw error; }
  }

  async endChat () {
    try {
      const result = await this.endVideo();
      this.emit('chat:ended', result);
      return result;
    } catch (error) { this.emit('chat:error', { error }); throw error; }
  }

  /**
   * Emits an event with the specified name and data.
   * This method creates a custom event with the provided data and dispatches it using the event emitter.
   * @param {string} eventName - The name of the event to emit.
   * @param {Object} data - The data to include in the event.
   */
  emit (eventName, data) {
    const event = new CustomEvent(eventName, {
      detail: {
        ...data,
        timestamp: Date.now(),
        clientId: this.config._clientId || Utils.generateId()
      }
    });
    this.eventEmitter.dispatchEvent(event);
  }

  /**
   * Registers an event listener for the specified event name.
   * This method wraps the callback to handle errors and ensures that the event is properly removed when no longer needed.
   * @param {string} eventName - The name of the event to listen for.
   * @param {Function} callback - The callback function to execute when the event is emitted.
   * @returns {Function} - A function to remove the event listener.
   */
  on (eventName, callback) {
    const wrappedCallback = (event) => {
      try {
        callback(event.detail);
      } catch (error) {
        this.errorHandler.logError('Event Handler Error', error, { eventName });
      }
    };
    this.eventEmitter.addEventListener(eventName, wrappedCallback);
    return () =>
      this.eventEmitter.removeEventListener(eventName, wrappedCallback);
  }

  /**
   * Removes an event listener for the specified event name.
   * This method removes the specified callback from the event emitter.
   * @param {string} eventName - The name of the event to stop listening for.
   * @param {EventListenerOrEventListenerObject | null} callback - The callback function to remove.
   */
  off (eventName, callback) {
    this.eventEmitter.removeEventListener(eventName, callback);
  }

  /**
   * Handles initialization errors by incrementing the retry count and categorizing the error.
   * This method checks the error message to determine the type of error and calls the error handler accordingly.
   * @param {Error} error - The error that occurred during initialization.
   */
  handleInitError (error) {
    this.retryCount++;

    if (error.message.includes('timeout')) {
      this.errorHandler.handleError(ErrorTypes.NETWORK_ERROR, error);
    } else if (error.message.includes('configuration')) {
      this.errorHandler.handleError(ErrorTypes.CONFIG_INVALID, error);
    } else if (error.message.includes('script')) {
      this.errorHandler.handleError(ErrorTypes.LIBRARY_LOAD_FAILED, error);
    } else {
      this.errorHandler.handleError(ErrorTypes.INTERNAL_ERROR, error);
    }
  }

  /**
   * Gets the current connection state of the client.
   * This method returns the current connection state, which can be "disconnected", "connecting", "connected", or "error".
   * @returns {string} - The current connection state.
   */
  getConnectionState () {
    return this.connectionState;
  }

  /**
   * Checks if the client is ready for use.
   * This method returns true if the client is in the "connected" state, otherwise false.
   * @returns {boolean} - True if the client is ready, false otherwise.
   */
  isReady () {
    return this.connectionState === 'connected';
  }

  destroy () {
    this.connectionState = 'disconnected';
    this.authProvider?.cancel();
    this.chatStyle?.remove();
    if (this.core) {
      this.core.endVideoEngagerInteraction(true)
        .then(() => this.core.destroyInstance())
        .catch(error => console.warn('Could not clean up VideoEngager:', error));
    }
  }
}
