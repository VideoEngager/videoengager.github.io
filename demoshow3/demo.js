const config = {
  prod: {
    envUrl: 'https://apps.mypurecloud.com',
    veUrl: 'https://videome.leadsecure.com',
    tenantId: '0FphTk091nt7G1W7'
  },
  staging: {
    envUrl: 'https://apps.mypurecloud.de',
    environment: 'prod-euc1',
    deploymentId: '50bce9ca-111b-4372-87ff-5f98ae8849e6', // 'a3201abf-c4bc-4742-8bd0-b55c34ef787d'
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

  const videoEngagerInstance = window.VideoEngagerWidget.initializeVeGenesysMessaging({
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
