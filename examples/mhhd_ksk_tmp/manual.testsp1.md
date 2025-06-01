**Manual Test Template** 

# VE Carousel Waitroom - Phase 1 Manual Test Protocol

## Test Setup
1. **Environment Preparation**
   - [ ] Chrome v123+ with DevTools open (Console tab)
   - [ ] NVDA/VoiceOver enabled (for accessibility tests)
   - [ ] `index.test.html` served via local web server

2. **Initialization**
   ```javascript
   // Paste in console:
   const carousel = document.getElementById('myCarousel');
   const testConfig = {
     slides: [{ title: "Test" }],
     theme: { componentBackground: "purple" },
     accessibility: { carouselLabel: "Test Carousel" }
   };
   ```

---

## 1. Logger Injection Tests
### Test LOG-01: Default Logger Warning
**Steps:**
1. Reload page with clean state
2. Observe console output during load

**Pass Criteria:**
- [ ] Console shows: "CRITICAL WARNING: No external production logger injected"

**Evidence:**
- [ ] Screenshot of console warning (attach: `logs/LOG-01-default-warning.png`)

---

### Test LOG-02: Valid Logger Injection
**Steps:**
```javascript
class TestLogger {
  debug(msg) { console.debug('[TEST LOGGER]', msg); }
  info(msg) { console.log('[TEST LOGGER]', msg); }
  warn(msg) { console.warn('[TEST LOGGER]', msg); }
  error(msg) { console.error('[TEST LOGGER]', msg); }
}
const el = document.createElement('ve-carousel-waitroom');
el.logger = new TestLogger();
document.body.appendChild(el);
```

**Pass Criteria:**
- [ ] Subsequent logs show `[TEST LOGGER]` prefix
- [ ] No default logger warnings

**Evidence:**
- [ ] Console snippet showing custom logger output

---

## 2. Configuration Tests
### Test CONF-01: Null Config Handling
**Steps:**
```javascript
carousel.config = null;
```

**Verifications:**
- [ ] Console error: "Invalid configuration: Config must be an object"
- [ ] Fail-safe message visible in DOM
- [ ] `error` event dispatched (check via listener)

**Evidence:**
```javascript
// Event listener for validation:
carousel.addEventListener('error', (e) => {
  console.assert(
    e.detail.errorCode === 'INVALID_CONFIG',
    'Event payload validation failed', e.detail
  );
});
```

Here's the **step-by-step tester guide** for executing `CONF-02: Malicious Config Testing` manually, designed for clinical-grade validation:

---

# **Manual Test Guide: CONF-02 (Malicious Config Handling)**  
**Objective:** Verify the component safely handles malicious/edge-case configurations  

### 📌 **Pre-Requisites**  
1. Fresh browser session with `index.test.html` loaded  
2. Console open (F12 → Console tab)  
3. Screen reader enabled (NVDA/VoiceOver) if testing a11y  

---

## 🔧 **Test Setup**  
**1. Initialize Component Reference**  
```javascript
const carousel = document.querySelector('ve-carousel-waitroom');
```

**2. Attach Event Listeners** *(Critical for validation)*  
```javascript
// Listen for errors and config changes
carousel.addEventListener('error', (e) => {
  console.log('EVENT ERROR:', e.detail);
});

carousel.addEventListener('configApplied', (e) => {
  console.log('EVENT CONFIG APPLIED:', e.detail);
});
```

---

## 🧪 **Test Scenarios**  
### **Case 1: Script Injection Attempt**  
**Steps:**  
1. Execute in console:  
   ```javascript
   carousel.config = {
     slides: [{
       title: '<img src=x onerror="alert(1)">',
       content: '<script>alert("XSS")</script>'
     }]
   };
   ```

**✅ Pass Criteria:**  
- [ ] **No alert popups** appear  
- [ ] Console shows sanitization warning:  
  ```log
  [TestHarnessApp] WARN: Sanitized malicious content in slide 0
  ```  
- [ ] DOM renders escaped content (visible angle brackets `&lt;script&gt;`)  
- [ ] `error` event **not** dispatched (invalid content isn't treated as fatal)  

**Evidence to Capture:**  
- Screenshot of DOM showing sanitized content  
- Console log snippet  

---

### **Case 2: Invalid Data Types**  
**Steps:**  
1. Execute in console:  
   ```javascript
   carousel.config = {
     slides: "not_an_array",
     theme: { componentBackground: 12345 } // Invalid color
   };
   ```

**✅ Pass Criteria:**  
- [ ] Console shows **two distinct errors**:  
  ```log
  [TestHarnessApp] ERROR: 'slides' property must be an array
  [TestHarnessApp] WARN: Invalid theme color (12345). Using fallback.
  ```  
- [ ] Fail-safe UI appears with message:  
  ```html
  <div class="fail-safe__message">Invalid slide configuration</div>
  ```  
- [ ] `error` event fires with `INVALID_CONFIG_SLIDES`  

**Evidence to Capture:**  
- Screenshot of fail-safe UI  
- Console logs showing both errors  

---

### **Case 3: Partial Config**  
**Steps:**  
1. Execute in console:  
   ```javascript
   carousel.config = { slides: [] }; // No theme/accessibility
   ```

**✅ Pass Criteria:**  
- [ ] Console shows warnings:  
  ```log
  [TestHarnessApp] WARN: 'theme' property missing. Using defaults.
  [TestHarnessApp] WARN: 'accessibility' property missing. Using defaults.
  ```  
- [ ] Component renders normally (no fail-safe)  
- [ ] `configApplied` event fires  

**Evidence to Capture:**  
- Screenshot of rendered carousel  
- Event payload in console  

---

## 🎥 **Accessibility Verification**  
**For All Cases:**  
- [ ] NVDA announces:  
  - *"Error: Invalid configuration"* (for failures)  
  - *"Configuration applied"* (for valid partial config)  
- [ ] No focus traps or keyboard navigation breaks  

**Tool:**  
```bash
npx axe http://localhost:3000 --save results/a11y-malicious.json
```

---

## 📝 **Defect Reporting Template**  
```markdown
**Title:** [Malicious Config Not Sanitized]  
**Test Case:** CONF-02-Case1  
**Steps:**  
1. Injected `<script>` in slide title  
2. Observed alert(1) execution  
**Expected:** No script execution  
**Actual:** Alert dialog appeared  
**Evidence:** [screenshot.png]  
```

---

## 📊 **Sign-Off Checklist**  
| Verified By | Date       | Case 1 | Case 2 | Case 3 | Notes          |  
|-------------|------------|--------|--------|--------|----------------|  
| [Tester]    | [Date]     | ✅/❌   | ✅/❌   | ✅/❌   | [Comments]     |  

**Approval:**  
- [ ] QA Lead  
- [ ] Security Reviewer  

---

### 💡 **Key Tips for Testers**  
1. **Clear State Between Tests**  
   ```javascript
   delete carousel.config; // Reset component
   ```  
2. **Double-Check Event Listeners**  
   - Ensure they’re attached *before* triggering actions  
3. **Cross-Browser Checks**  
   - Repeat test in Chrome/Firefox/Edge  

---

**Next Steps:**  
- [ ] Archive logs under `/evidence/CONF-02/`  
- [ ] Proceed to [EVT-02: Event Payload Validation](#)  

Need a **video recording protocol** for screen reader tests? Let me know!
---

## 3. Accessibility Tests
### Test A11Y-01: Keyboard Navigation
**Test Matrix:**
| Key Press | Expected Result                  |
|-----------|----------------------------------|
| Tab       | Focus moves host → cancel button |
| ArrowRight| Advances slide counter           |
| Escape    | Dispatches `userCancelled`       |

**Screen Reader Verification:**
- [ ] NVDA announces on focus: "Test Carousel, region"
- [ ] Slide changes announced via ARIA live region

**Evidence:**
- [ ] Video capture of keyboard navigation (attach: `media/kbd-nav.mp4`)

---

## 4. Event Validation
### Test EVT-01: Payload Structure
**Steps:**
```javascript
const testConfig = {
  slides: [
    {
      type: 'content',
      title: 'Test Slide 1',
      description: 'This slide should trigger slideChanged event'
    }
  ],
  theme: {
    componentBackground: '#ff0000', // Invalid color to force theme error
    primaryTextColor: 'invalid_color' // Another invalid value
  },
  accessibility: {
    carouselLabel: "Event Test Carousel",
    noSlidesText: "No slides to display (TEST)"
  },
  carousel: {
    interval: 0, // Test immediate autoplay error
    loop: 'invalid_value' // Purposely wrong type
  }
};
const carousel = document.querySelector('ve-carousel-waitroom');
const events = [];

// Attach listeners
['error', 'configApplied', 'slideChanged'].forEach(type => {
  carousel.addEventListener(type, (e) => events.push({
    type,
    bubbles: e.bubbles,
    composed: e.composed,
    detail: e.detail
  }));
});

// Trigger events
carousel.config = testConfig;          // Fires configApplied + error(s)
carousel.goToSlide(0);                // Fires slideChanged

// Validate
console.log('Captured Events:', events);
```

**Validation Checklist:**
- [ ] All events have `bubbles: true, composed: true`
- [ ] `detail` contains expected properties
- [ ] No `undefined`/`null` in payloads

**Evidence:**
```json
// Example valid payload
{
  "type": "slideChanged",
  "bubbles": true,
  "composed": true,
  "detail": {
    "currentIndex": 0,
    "totalSlides": 1
  }
}
```

---

## 5. Visual Regression
### Test VIS-01: Theme Application
**Steps:**
1. Apply theme:
   ```javascript
   carousel.config = {
     ...testConfig,
     theme: { componentBackground: "teal" }
   };
   ```
2. Inspect host styles

**Pass Criteria:**
- [ ] `--ve-cw-component-background: teal` set
- [ ] No layout shifts

**Evidence:**
- [ ] Screenshot comparison (attach: `screenshots/theme-apply-diff.png`)

---

## Test Completion Sign-off
| Test Area       | Verified By | Date       | Notes |
|-----------------|-------------|------------|-------|
| Logger          | [Name]      | [Date]     |       |
| Accessibility   | [Name]      | [Date]     |       |
| Events          | [Name]      | [Date]     |       |

**Approval:**
- [ ] QA Lead: ___________________ Date: ___
- [ ] CTO: _______________________ Date: ___

```

### Key Features:
1. **Structured Test Cases** - Each test has:
   - Clear setup instructions
   - Pass/fail criteria
   - Evidence collection steps
   - Code snippets for validation

2. **Audit-Ready Formatting**:
   - Explicit requirement tracing (LOG-01, CONF-01, etc.)
   - Machine-readable evidence (JSON, screenshots, videos)
   - Sign-off accountability

3. **Pre-Automation Validation**:
   - Verifies testability of all scenarios
   - Captures baseline outputs for automation
   - Confirms manual observation points

4. **Clinical-Grade Rigor**:
   - Negative case testing (null configs)
   - Event contract validation
   - Accessibility compliance checks
   - Visual regression baselining

**Next Steps:**
1. Execute this manual protocol once
2. Archive all evidence files
3. Use outputs to build automation scripts
4. Replace manual checks with automated assertions

Would you like me to provide companion:
- Evidence collection spreadsheet template
- Video recording protocol for screen reader tests
- Automated test generator based on manual results?