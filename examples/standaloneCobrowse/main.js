/* eslint-disable indent */
/* eslint-disable no-console */
/* globals VEHelpers, veCobrowse, showToastError, setState, showErrorMessage, tampermonkeyPrepare */

(async function () {
    /*
      * Main function to initialize cobrowse
    */
    const main = async function () {
        const veUrlInput = document.querySelector('#veUrl');
        const tenantIdInput = document.querySelector('#tenantId');
        const veUrl = veUrlInput.value;
        const tenantId = tenantIdInput.value;

      try {
        if (window?.veCobrowse?.initialized) {
          console.error('veCobrowse is already initialized');
          showToastError('Cobrowse is already initialized!');
          return;
        }

        await initializeStyles();
        await loadVeCobrowse(veUrl);
        await VEHelpers.documentLoaded();

        // demo floating button to start cobrowse with ui handlers
        const UI = VEHelpers.UIHandler({ click2video: false, veCobrowse: true, veIframe: false });

        /**
         * Handlers for cobrowse events
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
                handleSessionStarted(data);
                break;
              case 'session.authorizing':
                handleSessionAuthorizing();
                break;
              case 'session.ended':
                handleSessionEnded();
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

        const listener = {
          initialized: onInitialized,
          on: eventHandler,
          error: errorHandler
        };

        // initialize cobrowse
        await veCobrowse.init(veUrl, tenantId, listener);
        if (!veCobrowse.isEnabled()) {
          console.info('cobrowse is not enabled for tenant: ', tenantId);
          return;
        }
        if (veCobrowse.session) {
          // set floating button expandable content with pin
          UI.setExpandableContent({ interactionId: veCobrowse.session.id(), interactionType: 'ID' });
        }
        // set click listener for floating button to create cobrowse session
        UI.startCobrowseButton.addEventListener('click', async function () {
          try {
            if (!veCobrowse.isEnabled()) {
              console.error('cobrowse is not enabled');
              showToastError('Cobrowse is not enabled!');
              return;
            }
            if (UI.isCobrowseStarted()) {
              UI.setCobrowseEnded();
              UI.setExpandableContent({ interactionId: '', interactionType: '' });
              await veCobrowse.stop();
            } else {
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

    // load required functions and init main
    const loadScriptAndExecuteMain = function () {
      const script = document.createElement('script');
      script.src = 'https:///videoengager.github.io/videoengager/uilib/helpers.js';
      script.onload = async function () {
        await VEHelpers.requireAsync('/examples/standaloneCobrowse/scripts.js');
        document.querySelector('#initializeCoBrowse').addEventListener('click', main);
      };
      document.head.appendChild(script);
    };

    document.addEventListener('DOMContentLoaded', function () {
        loadScriptAndExecuteMain();
      });
  })();
