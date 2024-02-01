const validateInputListerenrs = function () {
  const initializeButton = document.querySelector('#initializeCoBrowse');
  const veUrlInput = document.getElementById('veUrl');
  const tenantIdInput = document.getElementById('tenantId');
  const errorMessage = document.getElementById('error-message');

  // disable initializeButton if inputs are empty
  if (veUrlInput.value.trim() === '' || tenantIdInput.value.trim() === '') {
    initializeButton.disabled = true;
  }

  function validateInputs () {
    const veUrlIsValid = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(veUrlInput.value);
    const tenantIdIsNotEmpty = tenantIdInput.value.trim() !== '';

    const inputsAreValid = veUrlIsValid && tenantIdIsNotEmpty;
    initializeButton.disabled = !inputsAreValid;
    errorMessage.style.display = inputsAreValid ? 'none' : 'block';
  }

  veUrlInput.addEventListener('input', validateInputs);
  tenantIdInput.addEventListener('input', validateInputs);
};

// on document load
window.addEventListener('DOMContentLoaded', async function () {
  validateInputListerenrs();
});
