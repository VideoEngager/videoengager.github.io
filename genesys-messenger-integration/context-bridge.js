// context-bridge.js
(function () {
    const form   = document.getElementById('ctx-form');
    const preset = document.getElementById('ctx-preset');
    const apply  = document.getElementById('ctx-apply');
    const out    = document.getElementById('ctx-json');
  
    const PRESETS = {
      travel: {
        sessionId: "ve_travel_001",
        customerId: "PAX-4451",
        caseId: "BOOK-AV-2025-0912",
        productSKU: "TKT-EUR-RT",
        deviceModel: "Web",
        priority: "high",
        locale: "en-GB",
        consentFlag: true,
        notes: "Unsure about baggage & missed connection rebooking"
      },
      banking: {
        sessionId: "ve_bank_001",
        customerId: "CUST-GOLD-22",
        caseId: "LOAN-APP-12345",
        productSKU: "MORT-30Y-FIXED",
        deviceModel: "Web",
        priority: "high",
        locale: "en-US",
        consentFlag: true,
        notes: "Income doc format question before submission"
      },
      healthcare: {
        sessionId: "ve_hc_001",
        customerId: "PAT-7741",
        caseId: "APPT-CARDIO-2025-10",
        productSKU: "SPECIALIST-CONSULT",
        deviceModel: "Web",
        priority: "normal",
        locale: "en-US",
        consentFlag: true,
        notes: "Coverage question for specialist visit"
      },
      telco: {
        sessionId: "ve_telco_001",
        customerId: "ACC-55621",
        caseId: "PLAN-UPGRADE-2025-09",
        productSKU: "FAMILY-ULTRA-5G",
        deviceModel: "Router-ACME-9000",
        priority: "high",
        locale: "en-US",
        consentFlag: true,
        notes: "Confused about fees; router troubleshooting"
      }
    };
  
    // helpers
    const readForm = () => {
      const data = {};
      [...new FormData(form).entries()].forEach(([k,v]) => {
        if (k === 'consentFlag') data[k] = (v === 'true');
        else data[k] = v;
      });
      return data;
    };
  
    const writeForm = (obj) => {
      Object.entries(obj).forEach(([k,v]) => {
        const el = form.elements.namedItem(k);
        if (!el) return;
        if (el.tagName === 'SELECT') el.value = String(v);
        else if (el.tagName === 'TEXTAREA') el.value = v ?? '';
        else el.value = v ?? '';
      });
      renderPreview();
    };
  
    const renderPreview = () => {
      out.textContent = JSON.stringify(readForm(), null, 2);
    };
  
    // flatten into "context.*" keys for Genesys DB & VE attributes
    const toContextAttributes = (obj) =>
      Object.fromEntries(Object.entries(obj).map(([k,v]) => [`context.${k}`, v]));
  
    // Apply to both VideoEngager instance and Genesys customAttributes
    const applyContext = async () => {
      const ctx = readForm();
      const attrs = toContextAttributes(ctx);
  
      // 1) Keep VE instance hot with the latest context (used on video start)
     // 1) Buffer OR apply to VE instance
     if (window.videoEngagerInstance) {
       window.videoEngagerInstance.customAttributes = {
         ...(window.videoEngagerInstance.customAttributes || {}),
         ...attrs
       };
     } else {
       // instance not ready yet → buffer
       window.__ctxBuffer = { ...(window.__ctxBuffer || {}), ...attrs };
     }
  
      // 2) Push into Genesys DB customAttributes (chat path + routing)
      if (window.Genesys && typeof window.PromiseGenesys === 'function') {
        try {
          await window.PromiseGenesys('command', 'Database.update', {
            messaging: { customAttributes: attrs }
          });
          // tiny delay to ensure the DB update settles before user clicks start
          await new Promise(r => setTimeout(r, 150));
        } catch (e) {
          console.warn('Context apply failed (Database.update)', e);
        }
      }
  
      // 3) Optional: minimal visual confirmation
      apply.setAttribute('data-ok', '1');
      setTimeout(() => apply.removeAttribute('data-ok'), 900);
    };
  
    // Wire events
    preset.addEventListener('change', () => {
      const p = preset.value;
      if (p !== 'custom') writeForm(PRESETS[p]);
    });
    form.addEventListener('input', renderPreview);
    apply.addEventListener('click', applyContext);
  
    // init
    writeForm(PRESETS.travel); // default preset
  })();
  