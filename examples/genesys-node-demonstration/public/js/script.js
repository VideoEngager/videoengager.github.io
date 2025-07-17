console.log('Script loaded');

async function handleFormSubmit(e) {
  console.log('Form submit handler called');
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  console.log('Form data:', data);

  // Show loading state
  const loadingEl = document.getElementById("loading");
  const resultEl = document.getElementById("result");
  const submitBtn = document.querySelector(".submit-btn");

  if (loadingEl) loadingEl.style.display = "block";
  if (resultEl) resultEl.style.display = "none";
  if (submitBtn) submitBtn.disabled = true;

  try {
    console.log('Making API request...');
    const response = await fetch("/api/schedule-callback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log('Response received:', response);
    const result = await response.json();
    console.log('Result:', result);

    if (response.ok) {
      showResult(
        "success",
        `
          <strong>Success!</strong> Your callback has been scheduled successfully.
          <br><br>
          <strong>Video URL:</strong> <a href="${
            result.videoUrl
          }" target="_blank">Join Video Call</a>
          <br>
          <strong>Callback ID:</strong> ${result.callbackId}
          <br>
          <strong>Scheduled Time:</strong> ${new Date(
            result.scheduledTime
          ).toLocaleString()}
        `
      );
      form.reset();
    } else {
      // Handle detailed error response
      let errorMessage = `<strong>Error:</strong> ${result.error || "Something went wrong"}`;
      
      // Add details if they exist
      if (result.details && Array.isArray(result.details) && result.details.length > 0) {
        errorMessage += '<br><br><strong>Details:</strong><ul>';
        result.details.forEach(detail => {
          errorMessage += `<li>${detail}</li>`;
        });
        errorMessage += '</ul>';
      }
      
      // Add request ID if available for debugging
      if (result.requestId) {
        errorMessage += `<br><small><strong>Request ID:</strong> ${result.requestId}</small>`;
      }
      
      showResult("error", errorMessage);
    }
  } catch (error) {
    console.error('Fetch error:', error);
    showResult("error", `<strong>Error:</strong> Failed to connect to server`);
  } finally {
    if (loadingEl) loadingEl.style.display = "none";
    if (submitBtn) submitBtn.disabled = false;
  }
}

function showResult(type, message) {
  const resultDiv = document.getElementById("result");
  if (resultDiv) {
    resultDiv.className = `result ${type}`;
    resultDiv.innerHTML = message;
    resultDiv.style.display = "block";
  }
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, looking for form...');
  
  const form = document.getElementById('callbackForm');
  console.log('Form found:', form);
  
  if (form) {
    console.log('Attaching event listener to form...');
    form.addEventListener('submit', handleFormSubmit);
    console.log('Event listener attached successfully');
    
    // Set default time to 1 hour from now
    const defaultTime = new Date();
    defaultTime.setHours(defaultTime.getHours() + 1);
    const timeInput = document.getElementById("desiredTime");
    if (timeInput) {
      timeInput.value = defaultTime.toISOString().slice(0, 16);
      console.log('Default time set');
    }
  } else {
    console.error('Form with id "callbackForm" not found!');
  }
});