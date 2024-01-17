/* eslint-disable indent */
/* eslint-disable no-console */
/* globals VEHelpers, veCobrowse, showToastError, setState, showErrorMessage, tampermonkeyPrepare */

let isActiveSession = false;
let UI = null;

/**
 * Handler for "cobrowse intialized" event
 */
const onInitialized = function () {
    setState('Cobrowse is initialized!');
    tampermonkeyPrepare();
  };

/**
 * Handler for session created event
 * @param {string} session
 * @param {JSON} data
 */
const eventHandler = function (event, data) {
    console.log('eventHandler', event, 'data:', JSON.stringify(data));
    switch (event) {
      case 'session.created':
        handleSessionCreated();
        break;
      case 'session.started':
        isActiveSession = true;
        handleSessionStarted(data, UI);
        break;
      case 'session.authorizing':
        handleSessionAuthorizing();
        break;
      case 'session.ended':
        isActiveSession = false;
        handleSessionEnded(UI);
        break;
      default:
        console.log('Unhandled event:', event, 'data:', JSON.stringify(data));
        break;
    }
  };

/**
 * Handler for session created event
 * @param {string} session
 * @param {JSON} data
 * @returns {Promise<void>}
*/
const errorHandler = function (error, state) {
  console.error('veCobrowse: error while ', state, ': ', error.toString());
  // possible states: createCobrowseSession, startCobrowse, stopCobrowse, init, getSettings
  showToastError('Error while ' + state + ': ' + error.toString());
};

(async function () {
    // ----- Main function to initialize cobrowse -----
    window.mainVeCobrose = async function () {
        // 1- get required parameters from input fields
        const veUrl = document.querySelector('#veUrl').value;
        const tenantId = document.querySelector('#tenantId').value;

      try {
        if (window?.veCobrowse?.initialized) {
          console.error('veCobrowse is already initialized');
          showToastError('Cobrowse is already initialized!');
          return;
        }

        // 2- load veCobrowse.js using veUrl
        await loadVeCobrowse(veUrl);

        // demo floating button to start cobrowse with ui handlers
        UI = VEHelpers.UIHandler({ click2video: false, veCobrowse: true, veIframe: false });

        const listener = {
          initialized: onInitialized,
          on: eventHandler,
          error: errorHandler
        };

        // 3- initialize cobrowse
        await veCobrowse.init(veUrl, tenantId, listener);
        if (!veCobrowse.isEnabled()) {
          console.info('cobrowse is not enabled for tenant: ', tenantId);
          return;
        }
        if (veCobrowse.session) {
          // set floating button expandable content with pin
          UI.setExpandableContent({ interactionId: veCobrowse.session.id(), interactionType: 'ID' });
        }
        // 4- start or stop cobrowse session on button click
        // set click listener for floating button to create cobrowse session
        UI.startCobrowseButton.addEventListener('click', async function () {
          try {
            if (!veCobrowse.isEnabled()) {
              console.error('cobrowse is not enabled');
              showToastError('Cobrowse is not enabled!');
              return;
            }

            // if session is active, stop cobrowse session on button click
            if (isActiveSession) {
              UI.setCobrowseEnded();
              UI.setExpandableContent({ interactionId: '', interactionType: '' });
              await veCobrowse.stop();
            } else {
              // if session is not active, create cobrowse session on button click
              UI.expandCobrowse();
              // actual function to create cobrowse session
              await veCobrowse.createCobrowseVeInteraction();
              UI.setExpandableContent({ interactionId: veCobrowse.session.code(), interactionType: 'PIN' });
            }
          } catch (e) {
            showToastError('Cobrowse is not loaded!');
            UI.closeExpandableContent();
          }
        });
        // click button to stop cobrose session
        UI.stopCobrowseButton.addEventListener('click', async function () {
          try {
            await veCobrowse.stop();
          } catch (e) {
           console.error(e);
          }
        });
      } catch (e) {
        console.error(e);
        showErrorMessage('Cannot initialize cobrowse!');
      }
    };

    // --- initialization functions ---
    // load required functions and init main
    const loadScriptAndExecuteMain = function () {
      // 2- load helpers.js to use common functions
      const script = document.createElement('script');
      script.src = 'https:///videoengager.github.io/videoengager/uilib/helpers.js';
      script.onload = async function () {
        // 3- load scripts.js which contains UI functions that are used in this example
        await VEHelpers.requireAsync('/examples/standaloneCobrowse/scripts.js');
        // 4- load and init veCobrose.js with provided parameters on initialize button click
        document.querySelector('#initializeCoBrowse').addEventListener('click', mainVeCobrose);
        // load styles for helpers.js
        await initializeStyles();
      };
      document.head.appendChild(script);
    };

    document.addEventListener('DOMContentLoaded', function () {
        // 1- start loading required scripts after page load
        loadScriptAndExecuteMain();
    });
  })();
