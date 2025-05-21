// src/client.js
export class VideoEngagerClient {
    constructor(config) {
      this.config = config;
      this._queueName = '__VideoEngagerQueue';
    }
  
    async init() {
      this._setupConfigProxy();
      await this._loadScript();
      await this._waitForReady();
    }
  
    // ————— Public API —————
    startChat()  { return window.VideoEngager.startGenesysChat(); }
    endChat()    { return window.VideoEngager.endGenesysChat(); }
    startVideo() { return window.VideoEngager.startVideoChatSession(); }
    endVideo()   { return window.VideoEngager.endVideoChatSession(); }
  
    on(evt, cb) {
      window.VideoEngager.on(evt, payload => cb(evt, payload));
    }
  
    off(evt, cb) {
      window.VideoEngager.off(evt, cb);
    }
  
    // ————— Internals —————
    _setupConfigProxy() {
      const cfg = this.config;
      window.__VideoEngagerConfigs = {
        videoEngager: {
          tenantId:     cfg.videoEngager.tenantId,
          veEnv:        cfg.videoEngager.veEnv,
          deploymentId: cfg.videoEngager.deploymentId,
          isPopup:      cfg.videoEngager.isPopup
        },
        genesys: {
          deploymentId: cfg.genesys.deploymentId,
          domain:       cfg.genesys.domain
        },
        useGenesysMessengerChat: cfg.useGenesysMessengerChat
      };
  
      // proxy queue
      window.__VideoEngagerQueue = [];
      window.VideoEngager = new Proxy({}, {
        get: (_, m) => (...a) =>
          new Promise((r, rj) =>
            window.__VideoEngagerQueue.push({ m, a, r, rj })
          )
      });
    }
  
    _loadScript() {
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.videoengager.com/widget/latest/browser/genesys-hub.umd.js';
        s.async = true;
        s.onload  = () => resolve();
        s.onerror = () => reject(new Error('Failed to load VideoEngager UMD'));
        document.head.appendChild(s);
      });
    }
  
    _waitForReady() {
      return new Promise(resolve => {
        window.VideoEngager.onReady(() => resolve());
      });
    }
  }
  