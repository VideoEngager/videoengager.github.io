// ----- Cobrowse Event Listeners Definitions -----

/**
 * Handler for "cobrowse initialized" event.
 */
const onInitialized = () => {
  setState('Cobrowse is initialized!');
  tampermonkeyPrepare();
};

/**
* Handler for various cobrowse events.
* @param {string} event - The event name.
* @param {JSON} data - Additional event data.
*/
const eventHandler = (event, data) => {
  console.log('eventHandler', event, 'data:', JSON.stringify(data));
  switch (event) {
    case 'session.created':
      handleSessionCreated();
      break;
    case 'session.started':
      handleSessionStarted(data, window.UI);
      break;
    case 'session.authorizing':
      handleSessionAuthorizing();
      break;
    case 'session.ended':
      handleSessionEnded(window.UI);
      break;
    default:
      console.log('Unhandled event:', event, 'data:', JSON.stringify(data));
      break;
  }
};

/**
* Handler for errors during cobrowse sessions.
* @param {Error} error - The error object.
* @param {string} state - The current state of the cobrowse session.
*/
const errorHandler = (error, state) => {
  console.error('veCobrowse: error while ', state, ': ', error.toString());
  showToastError(`Error while ${state}: ${error.toString()}`);
};

(async function () {
// ----- MAIN FUNCTIONS, INITIALIZE AND MANAGE COBROWSE -----
// Main CoBrowse Module
  const CoBrowseModule = (function () {
    let veCobrowse = null;

    async function init (veUrl, tenantId, onInitialized, eventHandler, errorHandler) {
      if (veCobrowse?.initialized) {
        throw new Error('veCobrowse is already initialized');
      }

      await loadVeCobrowse(veUrl);
      veCobrowse = window.veCobrowse;
      const listener = { initialized: onInitialized, on: eventHandler, error: errorHandler };
      await veCobrowse.init(veUrl, tenantId, listener);
    }

    async function startSession () {
      if (veCobrowse.session) {
        await stopSession();
      } else {
        await veCobrowse.createCobrowseVeInteraction();
        return { interactionId: veCobrowse.session.code(), interactionType: 'PIN' };
      }
    }

    async function stopSession () {
      if (veCobrowse.session) {
        await veCobrowse.stop();
        return { interactionId: '', interactionType: '' };
      }
    }

    function getSessionDetails () {
      return veCobrowse.session ? { interactionId: veCobrowse.session.id(), interactionType: 'ID' } : null;
    }

    return {
      init,
      startSession,
      stopSession,
      getSessionDetails
    };
  })();

  // UI Module
  const UIModule = (function () {
    let UI = null;
    function setupSessionControl (startCallback, stopCallback) {
      UI = VEHelpers.UIHandler({ click2video: false, veCobrowse: true, veIframe: false });
      window.UI = UI;
      UI.startCobrowseButton.addEventListener('click', startCallback);
      UI.stopCobrowseButton.addEventListener('click', stopCallback);
    }

    function updateSessionDetails (sessionDetails) {
      if (sessionDetails) {
        UI.setExpandableContent(sessionDetails);
        UI.expandCobrowse();
      } else {
        UI.closeExpandableContent();
      }
    }

    return {
      setupSessionControl,
      updateSessionDetails
    };
  })();

  // Main Function
  window.mainVeCobrose = async function () {
    const veUrl = document.querySelector('#veUrl').value;
    const tenantId = document.querySelector('#tenantId').value;

    try {
      await CoBrowseModule.init(veUrl, tenantId, onInitialized, eventHandler, errorHandler);

      UIModule.setupSessionControl(async () => {
        const details = await CoBrowseModule.startSession();
        UIModule.updateSessionDetails(details);
      }, async () => {
        const details = await CoBrowseModule.stopSession();
        UIModule.updateSessionDetails(details);
      });

      const sessionDetails = CoBrowseModule.getSessionDetails();
      if (sessionDetails) {
        UIModule.updateSessionDetails(sessionDetails);
      }
    } catch (e) {
      console.error(e);
      showToastError('Cannot initialize cobrowse!');
    }
  };

  // Function to dynamically load a script
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error(`Failed to load script ${src}`));
      document.head.appendChild(script);
    });
  };

  // Function to initialize the styles
  const initializeApplication = async () => {
    try {
      await loadScript('https:///videoengager.github.io/videoengager/uilib/helpers.js');
      await loadScript('/examples/standaloneCobrowse/scripts.js');
      await initializeStyles();
      document.querySelector('#initializeCoBrowse').addEventListener('click', window.mainVeCobrose);
    } catch (error) {
      console.error('Error initializing the application:', error);
    }
  };

  // Main function to start the application
  const main = () => {
    document.addEventListener('DOMContentLoaded', initializeApplication);
  };

  main();
})();
