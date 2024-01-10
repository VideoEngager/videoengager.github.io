/* eslint-disable indent */
/* eslint-disable no-console */
/* globals VEHelpers, veCobrowse */

(async function () {
  const parameters = {
    staging: {
      veUrl: 'https://staging.leadsecure.com',
      tenantId: 'oIiTR2XQIkb7p0ub'
    },
    dev: {
      veUrl: 'https://dev.videoengager.com',
      tenantId: 'eZD5WoDwpgwSu0q8'
    },
    prod: {
      veUrl: 'https://videome.leadsecure.com',
      tenantId: 'Xh6at3QenNopCTcP'
    },
    local: {
      veUrl: 'http://localhost:9000',
      tenantId: 'test_tenant'
    }
  };

  const main = async function () {
    // config
    const urlParams = new URLSearchParams(window.location.search);
    const env = urlParams.get('env') || 'staging';
    const { veUrl, tenantId } = parameters[env];
    await VEHelpers.requireAsync('http://localhost/videoengager/uilib/styles.css');
    await VEHelpers.requireAsync('http://localhost/videoengager/uilib/veCobrowse.js');
    await VEHelpers.documentLoaded();
    // set ui with ui handler
    const UI = VEHelpers.UIHandler({ click2video: false, veCobrowse: true, veIframe: false });
    // setup ve cobrowse
    await veCobrowse.init(veUrl, tenantId, {
      on: function (event, data) {
        const { sessionCode, id: sessionId } = data;
        console.log('pin: ', sessionCode, ' id: ', sessionId);

        if (event === 'session.ended') {
          UI.setCobrowseEnded();
          document.querySelector('#form').style.display = 'none';
        }
        if (event === 'session.started') {
          UI.setCobrowseStarted();
          document.querySelector('#form').style.display = 'block';
        }
        if (event === 'session.authorizing') {
          // during auth...
        }
      },
      error: function (error, state) {
        console.error('veCobrowse: error while ', state, ': ', error.toString());
        switch (state) {
          case 'createCobrowseSession':
            UI.showVENotification('Error: Cannot Create Session!');
            break;
          case 'startCobrowse':
            UI.showVENotification('Error: Cannot Start Cobrowse');
            break;
          case 'stopCobrowse':
            UI.showVENotification('Error: Cobrowse is not stopped!');
            break;
          case 'init':
            document.querySelector('#ve-start-cobrowse').style.backgroundColor = 'gray';
            UI.showVENotification('Error: Cannot initialize cobrowse! Check your settings.');
            break;
          case 'getSettings':
            document.querySelector('#ve-start-cobrowse').style.backgroundColor = 'gray';
            UI.showVENotification('Error: Cannot get settings! Check your parameters.');
            break;
          default:
            UI.showVENotification('Error');
            break;
        }
      }
    });
    if (!veCobrowse.isEnabled()) {
      console.info('cobrowse is not enabled for tenant: ', tenantId);
      return;
    }
    if (veCobrowse.session) {
      UI.setExpandableContent({ interactionId: veCobrowse.session.id(), interactionType: 'ID' });
    }
    // cobrowse ui
    UI.startCobrowseButton.addEventListener('click', async function () {
      try {
        if (!veCobrowse.isEnabled()) {
          console.error('cobrowse is not enabled');
          UI.showVENotification('Cobrowse is not enabled!');
          return;
        }
        if (UI.isCobrowseStarted()) {
          UI.setCobrowseEnded();
          UI.setExpandableContent({ interactionId: '', interactionType: '' });
          await veCobrowse.stop();
        } else {
          UI.expandCobrowse();
          await veCobrowse.createCobrowseVeInteraction();
          UI.setExpandableContent({ interactionId: veCobrowse.session.code(), interactionType: 'PIN' });
        }
      } catch (e) {
        UI.showVENotification('Cobrowse is not loaded!');
        UI.closeExpandableContent();
      }
    });
    UI.stopCobrowseButton.addEventListener('click', async function () {
      await veCobrowse.stop();
    });
  };

  const loadScriptAndExecuteMain = function () {
    const script = document.createElement('script');
    script.src = 'https:///videoengager.github.io/videoengager/uilib/helpers.js';
    script.onload = function () {
      main();
    };
    document.head.appendChild(script);
  };
  loadScriptAndExecuteMain();
})();
