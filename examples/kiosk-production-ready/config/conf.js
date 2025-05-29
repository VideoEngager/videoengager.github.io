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
    useGenesysMessengerChat: false
  },
  staging: {
    videoEngager: {
      tenantId: "oIiTR2XQIkb7p0ub",
      veEnv: "staging.videoengager.com",
      veHttps: true,
      isPopup: false,
    },
    genesys: {
      deploymentId: "ce6ed541-29fd-42ad-8fda-c245f683d43a",
      domain: "mypurecloud.de",
      hideGenesysLauncher: false,
    },
    useGenesysMessengerChat: false
  },
  production: {
    videoEngager: {
      tenantId: '0FphTk091nt7G1W7',
      veEnv: 'videome.leadsecure.com',
      isPopup: false,
    },
    genesys: {
      deploymentId: 'c5d801ae-639d-4e5e-a52f-4963342fa0dc',
      domain: 'mypurecloud.com',
    },
    useGenesysMessengerChat: false
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
  backgroundImage: "img/bg.png",
};

export {configs, metadata};
