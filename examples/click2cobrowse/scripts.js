let cobrowseStarted = false;
jQuery(document).ready(function ($) {
  const UI = VEHelpers.UIHandler({ click2video: false, veCobrowse: false, veIframe: false });
  $('#startCobrowse').click(async function () {
    try {
      if (!veCobrowse.isEnabled()) {
        console.error('cobrowse is not enabled');
        UI.showVENotification('Cobrowse is not enabled!');
        return;
      }
      if (cobrowseStarted) {
        cobrowseStarted = false;
        await veCobrowse.stop();
        CXBus.command('WebChatService.endChat');
        return;
      } else {
        cobrowseStarted = true;
        await veCobrowse.createCobrowseVeInteraction();
        const message = { interactionId: veCobrowse.veInteractionId };
        CXBus.command('WebChatService.startChat', message)
          .done(function (e) {
            CXBus.command('WebChatService.sendMessage', { message: JSON.stringify(message) }).done(function () {
              console.log('send message success:' + JSON.stringify(message));
              UI.showVENotification('Cobrowse Pin is sent to agent!');
              $('#startCobrowse').hide();
              $('#stopCobrowse').show();
            }).fail(function (e) {
              console.log('WebChatService.sendMessage failed', e);
              UI.showVENotification('Failed to send cobrowse pin to agent!');
            });
          }).fail(function (e) {
            console.log('WebChatService.startChat failed', e);
            UI.showVENotification('Failed to send cobrowse pin to agent!');
          });
      }
    } catch (e) {
      UI.showVENotification('Cobrowse is not loaded!');
    }
  });

  $('#stopCobrowse').click(async function () {
    cobrowseStarted = false;
    await veCobrowse.stop();
    CXBus.command('WebChatService.endChat');
  });
});

const parameters = {
  staging: {
    organizationId: '639292ca-14a2-400b-8670-1f545d8aa860',
    deploymentId: '1b4b1124-b51c-4c38-899f-3a90066c76cf',
    videoengagerUrl: 'https://staging.leadsecure.com',
    tennantId: 'oIiTR2XQIkb7p0ub',
    environment: 'https://api.mypurecloud.de',
    queue: 'Support'
  },
  dev: {
    organizationId: '327d10eb-0826-42cd-89b1-353ec67d33f8',
    deploymentId: 'c2eaaa5c-d755-4e51-9136-b5ee86b92af3',
    videoengagerUrl: 'https://dev.videoengager.com',
    tennantId: 'test_tenant',
    environment: 'https://api.mypurecloud.com.au',
    queue: 'video'
  },
  prod: {
    organizationId: 'c4b553c3-ee42-4846-aeb1-f0da3d85058e',
    deploymentId: '973f8326-c601-40c6-82ce-b87e6dafef1c',
    videoengagerUrl: 'https://videome.leadsecure.com',
    tennantId: '0FphTk091nt7G1W7',
    environment: 'https://api.mypurecloud.com',
    queue: 'TestQueue'
  }
};

function setConfig () {
  if (!window._genesys) window._genesys = {};
  if (!window._gt) window._gt = [];
  window._genesys.widgets = {
    main: {
      i18n: 'https://apps.mypurecloud.de/widgets/9.0/i18n/widgets-en.i18n.json',
      preload: [
        'webchatservice'
      ]
    },
    videoengager: {
      platform: 'purecloud',
      tenantId: 'oIiTR2XQIkb7p0ub',
      veUrl: 'https://staging.leadsecure.com',
      audioOnly: false,
      autoAccept: true,
      enablePrecall: false,
      useWebChatForm: false,
      extraAgentMessage: '**This is a VideoEngager Video Call!!!**',
      webChatFormData: {
        nickname: 'Visitor',
        firstname: 'Anonymous Customer',
        lastname: '',
        subject: 'Genesys Widget Demo',
        userData: {}
      }
    },
    webchat: {
      transport: {
        type: 'purecloud-v2-sockets',
        dataURL: 'https://api.mypurecloud.de',
        deploymentKey: '1b4b1124-b51c-4c38-899f-3a90066c76cf',
        orgGuid: '639292ca-14a2-400b-8670-1f545d8aa860',
        markdown: true,
        interactionData: {
          routing: {
            targetType: 'QUEUE',
            targetAddress: 'Support',
            priority: 2
          }
        }
      }
    },
    extensions: { VideoEngager: videoEngager.initExtension }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const env = urlParams.get('env') || 'staging';
  window._genesys.widgets.videoengager.tenantId = parameters[env].tennantId;
  window._genesys.widgets.videoengager.veUrl = parameters[env].videoengagerUrl;
  window._genesys.widgets.webchat.transport.dataURL = parameters[env].environment;
  window._genesys.widgets.webchat.transport.deploymentKey = parameters[env].deploymentId;
  window._genesys.widgets.webchat.transport.orgGuid = parameters[env].organizationId;
  window._genesys.widgets.webchat.transport.interactionData.routing.targetAddress = parameters[env].queue;
}

const main = async function () {
  // config
  const urlParams = new URLSearchParams(window.location.search);
  const env = urlParams.get('env') || 'staging';
  const { videoengagerUrl: veUrl, tennantId: tenantId } = parameters[env];
  await VEHelpers.requireAsync('https://apps.mypurecloud.de/widgets/9.0/cxbus.min.js');
  CXBus.configure({ debug: true, pluginsPath: 'https://apps.mypurecloud.de/widgets/9.0/plugins/' });
  await VEHelpers.documentLoaded();
  // load genesys settings for staging
  setConfig();
  CXBus.loadPlugin('widgets-core');
  // setup ve cobrowse
  await veCobrowse.init(veUrl, tenantId, {
    on: function (event, data) {
      if (event === 'session.ended') {
        // hide form
        $('#form').hide();
        $('#startCobrowse').show();
        $('#stopCobrowse').hide();
        $('#videoengagerIMG').show();
      }
      if (event === 'session.started') {
        $('#form').show();
        $('#startCobrowse').hide();
        $('#stopCobrowse').show();
        $('#videoengagerIMG').hide();
      }
    }
  });

  if (!veCobrowse.isEnabled()) {
    console.info('cobrowse is not enabled for tenant: ', tenantId);
  }
};

main();
