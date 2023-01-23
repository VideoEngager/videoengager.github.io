
const loadJS = function (url, id) {
  return new Promise(function (resolve, reject) {
    const scriptElement = document.createElement('script');
    if (typeof id === 'string') {
      scriptElement.setAttribute('id', id);
    }
    scriptElement.setAttribute('src', url);
    scriptElement.addEventListener('load', function () {
      resolve();
    });
    scriptElement.addEventListener('error', function (e) {
      reject(e);
    });
    document.head.append(scriptElement);
  });
};

async function loadLibrariesForFreshConfig () {
  await loadJS('configurationFile.js');

  /** Perform Loading Libraries */
  window.CXBus.configure({ debug: true, pluginsPath: 'https://apps.mypurecloud.com.au/widgets/9.0/plugins/' });
  window.CXBus.loadPlugin('widgets-core').done(function () {
    loadGenesysListeners();
  });
}
async function loadLibraries () {
  loadLibrariesForFreshConfig();
}
// genesys widgets listeners
function loadGenesysListeners () {
  // * (this means that user has submitted the Registration Form and the call is waiting to be picked by an agent) */

}

window.onload = function () {
  loadLibraries();
};
