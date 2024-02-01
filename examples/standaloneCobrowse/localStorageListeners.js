
const localStorageListeners = function () {
  document.querySelector('#saveToLocalStorage').addEventListener('click', function () {
    try {
      const data = {
        tenantId: document.querySelector('#tenantId').value,
        veUrl: document.querySelector('#veUrl').value
      };
      window.localStorage.setItem('data', JSON.stringify(data));
      showInfoMessage('Data is saved to localStorage');
    } catch (e) {
      console.error(e);
      showErrorMessage('Cannot save data to localStorage');
    }
  });
  document.querySelector('#clearData').addEventListener('click', function () {
    try {
      window.localStorage.clear();
      document.querySelector('#tenantId').value = '';
      document.querySelector('#veUrl').value = '';
      const initializeButton = document.querySelector('#initializeCoBrowse');
      initializeButton.disabled = true;
      showInfoMessage('Data is cleared from localStorage');
    } catch (e) {
      console.error(e);
      showErrorMessage('Cannot clear data from localStorage');
    }
  });
  try {
    const data = window.localStorage.getItem('data');
    if (data) {
      const { tenantId, veUrl } = JSON.parse(data);
      document.querySelector('#tenantId').value = tenantId;
      document.querySelector('#veUrl').value = veUrl;
    }
  } catch (e) {
    console.error(e);
    showErrorMessage('Cannot load data from localStorage');
  }
};

function showForSeconds (selector, message, seconds) {
  try {
    const element = document.querySelector(selector);
    element.innerHTML = message;
    element.style.display = 'block';
    setTimeout(function () {
      element.style.display = 'none';
    }, seconds * 1000);
  } catch (e) {
    console.error(e);
  }
}

function showInfoMessage (message) {
  showForSeconds('#info-message', message, 3);
}

function showErrorMessage (message) {
  showForSeconds('#error-message', message, 3);
}

document.addEventListener('DOMContentLoaded', function () {
  localStorageListeners();
});
