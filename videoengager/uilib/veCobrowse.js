/* global CobrowseIO */
(function () {
  window.veCobrowse = {
    settings: null,
    listener: null,
    veUrl: null,
    tenantId: null,
    veInteractionId: null,
    initialized: false,
    session: null,
    init: init,
    error: null,
    createCobrowseVeInteraction: createCobrowseVeInteraction,
    stop: stop,
    isEnabled: isEnabled,
    isRestored: false,
    setLisener: setListener,
    TIMEOUT: 10000
  };
  const veCobrowse = window.veCobrowse;
  const errorHandler = function (error, state) {
    veCobrowse.settings = null;
    veCobrowse.error = error;
    veCobrowse.initialized = false;
    veCobrowse.errorState = state;
    veCobrowse.listener.error(error, state);
    return veCobrowse;
  };
  async function init (veUrl, tenantId, listener) {
    async function getSettings (veUrl, tenantId) {
      try {
        const response = await fetch(`${veUrl}/api/brokerages/settingsFindByTennantId/${tenantId}`, {
          method: 'GET',
          accept: 'application/json'
        });
        const result = await response.json();
        return result;
      } catch (error) {
        return errorHandler(error, 'getSettings');
      }
    }

    try {
      await loadCobrowseScript({ w: window, t: 'script', c: 'CobrowseIO', TIMEOUT: veCobrowse.TIMEOUT });
      veCobrowse.listener = listener;
      veCobrowse.settings = await getSettings(veUrl, tenantId);
      veCobrowse.initialized = true;
      veCobrowse.veUrl = veUrl;
      veCobrowse.tenantId = tenantId;
      veCobrowse.error = null;
      console.log('veCobrowse: init successful, cobrowse enabled: ', isEnabled());
      if (!veCobrowse.isEnabled()) {
        console.log('veCobrowse: init successful not enabled, exiting: ', isEnabled());
        return veCobrowse;
      }
      CobrowseIO.license = veCobrowse?.settings?.cobrowse?.license;
      CobrowseIO.registration = true;
      await CobrowseIO.client();
      if (CobrowseIO.currentSession) {
        await createCobrowseSession();
      }
      return veCobrowse;
    } catch (error) {
      return errorHandler(error, 'init');
    }
  }

  async function createCobrowseVeInteraction () {
    try {
      if (!veCobrowse.initialized || !veCobrowse.isEnabled()) {
        console.error('createCobrowseVeInteraction: cobrowse is not initialized or enabled: ', veCobrowse);
        return null;
      }
      await createCobrowseSession();

      const options = {
        type: 'COBROWSE',
        cobrowseData: {
          code: veCobrowse.session.code(),
          session: veCobrowse.session.id()
        }
      };
      const response = await fetch(`${veCobrowse.veUrl}/api/interactions/createByVisitor/${veCobrowse.tenantId}`, {
        method: 'POST',
        accept: 'application/json',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      });
      const interaction = await response.json();
      veCobrowse.veInteractionId = interaction.interactionId;
      return interaction;
    } catch (error) {
      return errorHandler(error, 'createCobrowseVeInteraction');
    }
  }

  async function createCobrowseSession () {
    try {
      await CobrowseIO.start();
      if (!CobrowseIO.currentSession) {
        veCobrowse.session = await CobrowseIO.createSession();
        veCobrowse.isRestored = false;
      } else {
        veCobrowse.session = CobrowseIO.currentSession;
        veCobrowse.isRestored = true;
      }
      CobrowseIO.on('session.ended', session => {
        console.log('A session was ended', session);
        if (veCobrowse.listener) {
          veCobrowse.listener.on('session.ended', { code: session.code(), id: session.id() });
          veCobrowse.session = null;
          veCobrowse.veInteractionId = null;
        }
      });
      CobrowseIO.on('session.updated', session => {
        console.log('A session was started', session);
        if (veCobrowse.listener && session.state() === 'active') {
          veCobrowse.listener.on('session.started', { code: session.code(), id: session.id() });
        }
        if (veCobrowse.listener && session.state() === 'authorizing') {
          veCobrowse.listener.on('session.authorizing', { code: session.code(), id: session.id() });
        }
      });
    } catch (error) {
      return errorHandler(error, 'createCobrowseSession');
    }
  }

  function isEnabled () {
    return !!veCobrowse?.settings?.cobrowse?.enabled;
  }
  function setListener (listener) {
    veCobrowse.listener = listener;
  }

  async function stop () {
    try {
      await CobrowseIO.stop();
      veCobrowse.session = null;
      veCobrowse.veInteractionId = null;
    } catch (error) {
      console.error('veCobrowse: error while stop: ', error.toString());
    }
  }
})();

// cobrowseIO script loader
async function loadCobrowseScript ({ w, t, c, TIMEOUT }) {
  return new Promise(function (resolve, reject) {
    w[c] = {
      client: function () {
        if (!w[c].script) {
          w[c].script = document.createElement(t);
          w[c].script.src = 'https://js.cobrowse.io/CobrowseIO.js';
          w[c].script.async = 1;
          const e = document.getElementsByTagName(t)[0];
          e.parentNode.insertBefore(w[c].script, e);

          w[c].script.onload = function () { resolve(w[c]); };

          setTimeout(function () {
            reject(new Error('Script load timeout'));
          }, TIMEOUT);
        }
        return w[c].promise;
      }
    };
    w[c].promise = w[c].client();
  });
}
