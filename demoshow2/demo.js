const config = {
  prod: {
    envUrl: 'https://apps.mypurecloud.com',
    veUrl: 'https://videome.leadsecure.com',
    tenantId: '0FphTk091nt7G1W7'
  },
  staging: {
    envUrl: 'https://apps.mypurecloud.ie',
    veUrl: 'https://uae.leadsecure.com',
    tenantId: 'tjgaLJugv7IgWfiL',
    deploymentId: '22f203f1-d9fa-4cb9-a6d4-0fb4d2ca9f60',
    environment: 'prod-euw1'
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

  const videoEngagerInstance = window.VideoEngagerWidget.initializeVeGensysMessaging({
    TENANT_ID: tenantId,
    veUrl,
    customAttributes: {},
    autoAccept: true,
    environment,
    deploymentId,
    envUrl,
    debug: true
  });
  window.videoEngagerInstance = videoEngagerInstance;
});
