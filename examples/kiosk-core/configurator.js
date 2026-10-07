(function () {
  const form = document.getElementById('configurator');
  const fields = form.elements;
  const errorMessage = document.getElementById('config-error');
  const status = document.getElementById('config-status');
  const authSettings = document.getElementById('auth-settings');
  const deploymentHelp = document.getElementById('deployment-help');

  function showError (message = '') {
    errorMessage.textContent = message;
    errorMessage.hidden = !message;
  }

  function showAuthSettings () {
    authSettings.hidden = !fields.auth.checked;
    for (const input of authSettings.querySelectorAll('input, select')) input.disabled = !fields.auth.checked;
    deploymentHelp.textContent = fields.auth.checked
      ? 'Authentication needs an authenticated Genesys deployment. Production has a demo preset; other environments need your own deployment ID.'
      : 'Use the deployment ID belonging to your Genesys organization and environment.';
  }

  function fill (config) {
    for (const [name, value] of new URLSearchParams(window.KioskConfig.toSearch(config))) {
      if (fields[name].type === 'checkbox') fields[name].checked = value === 'true';
      else fields[name].value = value;
    }
    showAuthSettings();
  }

  fields.env.addEventListener('change', () => {
    const preset = window.KioskConfig.presets[fields.env.value];
    fields.veDomain.value = preset.videoEngager.veEnv;
    fields.veTenantId.value = preset.videoEngager.tenantId;
    fields.genesysDomain.value = preset.genesys.domain;
    fields.genesysDeploymentId.value = fields.auth.checked ? (preset.authenticatedDeploymentId || '') : preset.genesys.deploymentId;
    showError();
  });

  fields.auth.addEventListener('change', () => {
    const preset = window.KioskConfig.presets[fields.env.value];
    const currentDeployment = fields.genesysDeploymentId.value;
    if (fields.auth.checked && currentDeployment === preset.genesys.deploymentId) {
      fields.genesysDeploymentId.value = preset.authenticatedDeploymentId || '';
    } else if (!fields.auth.checked && (!currentDeployment || currentDeployment === preset.authenticatedDeploymentId)) {
      fields.genesysDeploymentId.value = preset.genesys.deploymentId;
    }
    showAuthSettings();
    showError();
  });

  function kioskUrl () {
    // Checkbox values are explicit; unchecked boxes must override true defaults.
    const query = new URLSearchParams(new FormData(form));
    for (const name of ['auth', 'waitingScreen', 'chatMinimized', 'postCallSurvey', 'cleanupOnUnload']) query.set(name, String(fields[name].checked));
    const config = window.KioskConfig.read(query.toString());
    const url = new URL('index.html', window.location.href);
    url.search = window.KioskConfig.toSearch(config);
    return url.href;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    showError();
    try { window.location.assign(kioskUrl()); } catch (error) { showError(error.message); }
  });

  document.getElementById('copy-link').addEventListener('click', async () => {
    showError();
    status.textContent = '';
    if (!form.reportValidity()) return;
    try {
      const url = kioskUrl();
      await navigator.clipboard.writeText(url);
      status.textContent = 'Kiosk link copied.';
    } catch (error) {
      showError(error.name === 'NotAllowedError' || !navigator.clipboard ? 'Link copying requires HTTPS or localhost and clipboard permission. Launch the kiosk and copy its address instead.' : error.message);
    }
  });

  document.getElementById('redirect-uri').textContent = new URL('index.html', window.location.href).href;
  try {
    for (const domain of window.KioskConfig.genesysDomains) {
      const option = document.createElement('option');
      option.value = domain;
      option.textContent = domain;
      fields.genesysDomain.appendChild(option);
    }
    fill(window.KIOSK_CONFIG || window.KioskConfig.read());
    if (window.KIOSK_CONFIG_ERROR) showError(window.KIOSK_CONFIG_ERROR);
  } catch (error) {
    showError(error.message || 'Configuration could not load. Check your connection and reload.');
    for (const field of fields) field.disabled = true;
  }
}());
