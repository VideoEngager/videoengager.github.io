/* eslint-disable no-undef */

// Configuration
const config = {
  prod: {
    envUrl: 'https://apps.mypurecloud.com',
    veUrl: 'https://videome.leadsecure.com',
    tenantId: '0FphTk091nt7G1W7'
  },
  staging: {
    envUrl: 'https://apps.mypurecloud.de',
    environment: 'prod-euc1',
    deploymentId: '50bce9ca-111b-4372-87ff-5f98ae8849e6',
    veUrl: 'https://staging.leadsecure.com',
    tenantId: 'oIiTR2XQIkb7p0ub'
  },
  dev: {
    envUrl: 'https://apps.mypurecloud.com.au',
    deploymentId: 'd922cea5-9e7c-4436-802d-3f1526890f79',
    environment: 'prod-apse2',
    veUrl: 'https://dev.videoengager.com',
    tenantId: 'test_tenant'
  }
};

document.addEventListener('DOMContentLoaded', function () {
  const urlParams = new URLSearchParams(window.location.search);
  const env = urlParams.get('env') || 'staging';
  let { envUrl, environment, deploymentId, veUrl, tenantId } = config[env];
  // update config parameters from environment variables
  environment = urlParams.get('environment') || environment;
  deploymentId = urlParams.get('deploymentId') || deploymentId;
  tenantId = urlParams.get('tenantId') || tenantId;

  let controller;

  // Initialize Genesys
  window._genesysJs = 'Genesys';
  window.Genesys = window.Genesys || function () {
    (window.Genesys.q = window.Genesys.q || []).push(arguments);
  };
  window.Genesys.t = 1 * new Date();
  window.Genesys.c = { environment, deploymentId, debug: true };

  const ys = document.createElement('script');
  ys.async = 1;
  ys.src = `${envUrl}/genesys-bootstrap/genesys.min.js`;
  ys.charset = 'utf-8';
  document.head.appendChild(ys);

  // Utility functions
  function PromiseGenesys (command, action, payload) {
    return new Promise((resolve, reject) => {
      Genesys(command, action, payload, response => {
        setTimeout(() => resolve(response), 500);
      }, err => {
        console.error(err);
        reject(err);
      });
    });
  }

  async function startSession () {
    const iframeSelected = document.getElementById('iframe').checked;
    const iframe = iframeSelected ? document.getElementById('iframeHolder') : null;

    if (!controller?.isCallOngoing()) {
      controller = new VideoEngagerController({
        TENANT_ID: tenantId,
        veUrl: veUrl,
        customAttributes: {},
        autoAccept: true,
        startWithVideo: true,
        iframeHolder: iframe
      });
    }

    const interactionId = controller.start();
    if (!document.getElementById('stopSession').disabled) return;

    await PromiseGenesys('command', 'Database.set', {
      messaging: {
        customAttributes: {
          'context.veVisitorId': interactionId
        }
      }
    });
    await PromiseGenesys('command', 'MessagingService.sendMessage', {
      message: 'Start Video Session'
    });

    document.getElementById('stopSession').disabled = false;
  }

  async function stopSession (sendMessage = true) {
    await PromiseGenesys('command', 'Database.update', {
      messaging: {
        customAttributes: {
          'context.veVisitorId': '0'
        }
      }
    });

    if (sendMessage) {
      await PromiseGenesys('command', 'MessagingService.sendMessage', {
        message: 'Remove Video Session'
      });
    }

    controller?.stop();
    document.getElementById('stopSession').disabled = true;
  }

  // Event Listeners
  Genesys('subscribe', 'Messenger.ready', () => {
    document.getElementById('videoEngager').style.display = 'block';
    document.getElementById('message').textContent = 'Messenger is ready';
    Genesys('command', 'Messenger.open');
    document.getElementById('startSession').disabled = false;
  });

  Genesys('subscribe', 'Messenger.error', () => {
    document.getElementById('message').textContent = 'Messenger is not ready';
  });

  Genesys('subscribe', 'MessagingService.conversationDisconnected', ({ data }) => {
    console.log('DISCONNECTED', data);
    if (controller?.isCallOngoing()) stopSession(false);
  });

  document.getElementById('startSession').addEventListener('click', startSession);
  document.getElementById('stopSession').addEventListener('click', stopSession);

  window.addEventListener('message', function (e) {
    if (e.data.type === 'popupClosed') {
      stopSession(false);
    }
    if (e.data.type === 'callEnded') {
      stopSession();
    }
  }, false);
});
