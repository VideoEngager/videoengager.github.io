// Context Presets Configuration
const PRESETS = {
  travel: {
    firstName: "Ava Rossi",
    emailAddress: "ava.rossi@example.com",
    phoneNumber: "+39 02 1234 5678",
    sessionId: "ve_travel_001",
    customerId: "PAX-4451",
    caseId: "BOOK-AV-2025-0912",
    productSKU: "TKT-EUR-RT",
    deviceModel: "Web",
    priority: "high",
    locale: "en-GB",
    consentFlag: "true",
    notes: "Unsure about baggage & missed connection rebooking"
  },
  banking: {
    firstName: "John Smith",
    emailAddress: "john.smith@example.com",
    phoneNumber: "+1 555 123 4567",
    sessionId: "ve_bank_001",
    customerId: "CUST-GOLD-22",
    caseId: "LOAN-APP-12345",
    productSKU: "MORT-30Y-FIXED",
    deviceModel: "Web",
    priority: "high",
    locale: "en-US",
    consentFlag: "true",
    notes: "Income doc format question before submission"
  },
  healthcare: {
    firstName: "Sarah Johnson",
    emailAddress: "sarah.j@example.com",
    phoneNumber: "+1 555 987 6543",
    sessionId: "ve_hc_001",
    customerId: "PAT-7741",
    caseId: "APPT-CARDIO-2025-10",
    productSKU: "SPECIALIST-CONSULT",
    deviceModel: "Web",
    priority: "normal",
    locale: "en-US",
    consentFlag: "true",
    notes: "Coverage question for specialist visit"
  },
  telco: {
    firstName: "Mike Chen",
    emailAddress: "mike.chen@example.com",
    phoneNumber: "+1 555 456 7890",
    sessionId: "ve_telco_001",
    customerId: "ACC-55621",
    caseId: "PLAN-UPGRADE-2025-09",
    productSKU: "FAMILY-ULTRA-5G",
    deviceModel: "Router-ACME-9000",
    priority: "high",
    locale: "en-US",
    consentFlag: "true",
    notes: "Confused about fees; router troubleshooting"
  },
  custom: {
    firstName: "Ava Rossi",
    emailAddress: "ava.rossi@example.com",
    phoneNumber: "+39 02 1234 5678",
    sessionId: "ve_demo_001",
    customerId: "CUST-9988",
    caseId: "CASE-2025-0912",
    productSKU: "SKU-12345",
    deviceModel: "Model-X",
    priority: "high",
    locale: "it-IT",
    consentFlag: "true",
    notes: "Video freezes after 2 minutes"
  }
};

// Initialize context functionality
function initContextPresets() {
  const presetSelect = document.getElementById('ctx-preset');
  const applyBtn = document.getElementById('ctx-apply');
  const form = document.getElementById('ctx-form');
  const jsonPreview = document.getElementById('ctx-json');

  // Update JSON preview whenever form changes
  function updateJsonPreview() {
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    jsonPreview.textContent = JSON.stringify(data, null, 2);
  }

  // Apply preset to form
  function applyPreset(presetName) {
    const preset = PRESETS[presetName];
    if (!preset) return;

    // Update all form fields
    Object.entries(preset).forEach(([key, value]) => {
      const input = form.elements[key];
      if (input) {
        input.value = value;
      }
    });

    // Update JSON preview
    updateJsonPreview();
  }

  // Event listeners
  applyBtn.addEventListener('click', () => {
    const selectedPreset = presetSelect.value;
    applyPreset(selectedPreset);
  });

  // Auto-update JSON preview on any form change
  form.addEventListener('input', updateJsonPreview);
  form.addEventListener('change', updateJsonPreview);

  // Initialize with default preset
  applyPreset('travel');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContextPresets);
} else {
  initContextPresets();
}

export { PRESETS, initContextPresets };