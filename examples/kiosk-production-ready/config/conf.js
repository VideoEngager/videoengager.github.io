const configs = {
  dev: {
    videoEngager: {
      tenantId: "test_tenant",
      veEnv: "dev.videoengager.com",
      veHttps: true,
      isPopup: false,
    },
    genesys: {
      deploymentId: "0928a947-d4bd-4524-9fc3-d98cb7938a83",
      domain: "mypurecloud.com.au",
      hideGenesysLauncher: false,
    },
    useGenesysMessengerChat: false,
    monitoring: {
      enabled: true,
      level: "debug",
    },
  },
  staging: {
    videoEngager: {
      tenantId: window.ENV_CONFIG?.VE_TENANT_ID || "staging_tenant",
      veEnv: window.ENV_CONFIG?.VE_ENV || "staging.videoengager.com",
      veHttps: true,
      isPopup: false,
      deploymentId: window.ENV_CONFIG?.VE_DEPLOYMENT_ID,
    },
    genesys: {
      deploymentId:
        window.ENV_CONFIG?.GENESYS_DEPLOYMENT_ID ||
        "0928a947-d4bd-4524-9fc3-d98cb7938a83",
      domain: window.ENV_CONFIG?.GENESYS_DOMAIN || "mypurecloud.com.au",
      hideGenesysLauncher: false,
    },
    useGenesysMessengerChat: false,
    monitoring: {
      enabled: true,
      level: "info",
    },
  },
  production: {
    videoEngager: {
      tenantId: window.ENV_CONFIG?.VE_TENANT_ID,
      veEnv: window.ENV_CONFIG?.VE_ENV,
      veHttps: true,
      isPopup: false,
      deploymentId: window.ENV_CONFIG?.VE_DEPLOYMENT_ID,
    },
    genesys: {
      deploymentId: window.ENV_CONFIG?.GENESYS_DEPLOYMENT_ID,
      domain: window.ENV_CONFIG?.GENESYS_DOMAIN,
      hideGenesysLauncher: false,
    },
    useGenesysMessengerChat: false,
    monitoring: {
      enabled: true,
      level: "error",
    },
  }
};

const metadata = {
  carouselItems: [
    { src: "img/slide-1.avif" },
    { src: "img/slide-2.avif" },
    { src: "img/slide-3.avif" },
    {
      src: "https://www.videoengager.com/wp-content/uploads/2020/05/image-for-slider-1-768x392.jpg",
    },
  ],
  backgroundImage: "img/carribeanbateries.webp",
};

export {configs, metadata};
