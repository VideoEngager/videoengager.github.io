// public/js/VideoEngagerClient.js

(function(global) {
  class VideoEngagerClient {
    constructor(config) {
      this.config = config;
    }

    /** Promise that resolves when the SDK fires its onReady */
    get ready() {
      return new Promise(resolve => {
        global.VideoEngager.onReady(resolve);
      });
    }

    /** Validates required config fields before init */
    validateConfig() {
      const c = this.config;
      if (!c.videoEngager?.tenantId)     throw new Error('Missing videoEngager.tenantId');
      if (!c.videoEngager?.veEnv)        throw new Error('Missing videoEngager.veEnv');
      if (typeof c.videoEngager.isPopup !== 'boolean')
        throw new Error('Missing videoEngager.isPopup (true|false)');
      if (c.useGenesysMessengerChat) {
        if (!c.genesys?.deploymentId)     throw new Error('Missing genesys.deploymentId');
        if (!c.genesys?.domain)           throw new Error('Missing genesys.domain');
      }
    }

    /** Loads the UMD script, setting up the proxy and config first */
    async init() {
      this.validateConfig();
      this._setupConfigProxy();
      await this._loadScript();
      await this._waitForReady();
    }

    // ————— Public API —————

    /** Starts a Genesys chat session */
    startChat()  { return global.VideoEngager.startGenesysChat(); }
    /** Ends the current Genesys chat session */
    endChat()    { return global.VideoEngager.endGenesysChat(); }
    /** Starts a VideoEngager video session */
    startVideo() { return global.VideoEngager.startVideoChatSession(); }
    /** Ends the current video session */
    endVideo()   { return global.VideoEngager.endVideoChatSession(); }

    /** Subscribe to SDK events: evt is string, cb(evt, payload) */
    on(evt, cb)  { global.VideoEngager.on(evt, payload => cb(evt, payload)); }
    /** Unsubscribe from SDK events */
    off(evt, cb) { global.VideoEngager.off(evt, cb); }

    // ————— Internals —————

    /** Applies the config and installs the proxy queue */
    _setupConfigProxy() {
      const cfg = this.config;
      global.__VideoEngagerConfigs = {
        videoEngager: {
          tenantId:     cfg.videoEngager.tenantId,
          veEnv:        cfg.videoEngager.veEnv,
          deploymentId: cfg.videoEngager.deploymentId || '',
          isPopup:      cfg.videoEngager.isPopup
        },
        genesys: {
          deploymentId: cfg.genesys?.deploymentId || '',
          domain:       cfg.genesys?.domain || ''
        },
        useGenesysMessengerChat: !!cfg.useGenesysMessengerChat
      };

      // Create the proxy queue before loading the UMD
      global.__VideoEngagerQueue = [];
      global.VideoEngager = new Proxy({}, {
        get: (_, method) => (...args) =>
          new Promise((resolve, reject) =>
            global.__VideoEngagerQueue.push({ m: method, a: args, r: resolve, rj: reject })
          )
      });
    }

    /** Injects the UMD bundle */
    _loadScript() {
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src    = 'https://cdn.videoengager.com/widget/latest/browser/genesys-hub.umd.js';
        s.async  = true;
        s.onload = () => resolve();
        s.onerror= () => reject(new Error('Failed to load VideoEngager UMD'));
        document.head.appendChild(s);
      });
    }

    /** Waits for the SDK’s onReady to fire */
    _waitForReady() {
      return new Promise(resolve => {
        global.VideoEngager.onReady(resolve);
      });
    }
  }

  // Expose to the global window
  global.VideoEngagerClient = VideoEngagerClient;

})(window);
