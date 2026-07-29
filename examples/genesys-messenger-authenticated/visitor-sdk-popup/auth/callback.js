const CALLBACK_MESSAGE = 'videoengager:okta-callback';
const statusElement = document.getElementById('status');
const parameters = new URLSearchParams(window.location.search);

if (!parameters.has('pending')) {
  const message = {
    type: CALLBACK_MESSAGE,
    code: parameters.get('code'),
    state: parameters.get('state'),
    error: parameters.get('error'),
    errorDescription: parameters.get('error_description')
  };

  window.history.replaceState(null, document.title, window.location.pathname);

  if (!window.opener) {
    statusElement.textContent = 'The application window is no longer available.';
  } else {
    statusElement.textContent = 'Authentication complete. You can close this window.';
    window.opener.postMessage(message, window.location.origin);
    window.setTimeout(() => window.close(), 100);
  }
}
