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
  },
  canary: {
    veUrl: 'http://canary.leadsecure.com',
    tenantId: ''
  }
};
/*
  Set tenantId and veUrl form inputs based on URL's 'env' parameter (ex: index.html?env=staging)
*/
(function () {
  function getQueryParams () {
    const queryParams = {};
    new URLSearchParams(window.location.search).forEach((value, key) => {
      queryParams[key] = value;
    });
    return queryParams;
  }

  // Extract the 'env' parameter from the URL
  const queryParams = getQueryParams();
  const env = queryParams.env;

  // Check if the environment is defined in the parameters
  if (parameters[env]) {
    // Set the tenantId and veUrl
    const { veUrl, tenantId } = parameters[env];
    document.getElementById('veUrl').value = veUrl;
    document.getElementById('tenantId').value = tenantId;
  }
})();
