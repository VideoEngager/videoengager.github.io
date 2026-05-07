// ==UserScript==
// @name         VideoEngager - Join Video by PIN
// @namespace    https://videoengager.com/
// @version      1.1.0
// @description  Enter a PIN -> validate via Swagger PIN API -> open floating VideoEngager iframe
// @author       VideoEngager
//
//
// @match        https://www.videoengager.com/*
// @match        https://videoengager.com//*
//
// @connect      videome.leadsecure.com
//
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==

(() => {
  "use strict";

  /*****************************************************************
   * Swagger mapping (from uploaded swagger.pin.yaml)
   *   Server: https://videome.leadsecure.com
   *   GET /api/shorturls/pin/{pin}
   *   200 -> { shortUrl: string }
   *   400 -> { err: string } (Expired)
   *   404 -> Not found
   *****************************************************************/
  const CONFIG = {
    apiBase: "https://videome.leadsecure.com",
    endpointTemplate: "/api/shorturls/pin/{pin}",

    // Front-end PIN format rules (server remains authoritative)
    pin: {
      minLen: 3,
      maxLen: 20,
      allowOnlyDigits: false, // set true if your PINs are numeric only
    },

    ui: {
      joinText: "Join with PIN",
      closeText: "Close video",
      buttonBottomPx: 24,
      buttonRightPx: 24,
      iframeWidthPx: 420,
      iframeHeightPx: 680,
      iframeMinWidthPx: 320,
      iframeMinHeightPx: 420,
    },

    // If API ever returns a relative shortUrl, resolve it against this base:
    shortUrlBase: "https://videome.leadsecure.com",
  };

  GM_addStyle(`
    .ve-pin-btn{
      position:fixed; right:${CONFIG.ui.buttonRightPx}px; bottom:${CONFIG.ui.buttonBottomPx}px;
      z-index:2147483647; padding:12px 14px; border-radius:999px; border:0; cursor:pointer;
      font:600 14px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
      box-shadow:0 8px 26px rgba(0,0,0,.22); background:#111827; color:#fff;
    }
    .ve-pin-btn:disabled{opacity:.65; cursor:not-allowed;}
    .ve-modal-backdrop{
      position:fixed; inset:0; z-index:2147483646; background:rgba(0,0,0,.42);
      display:flex; align-items:center; justify-content:center; padding:16px;
    }
    .ve-modal{
      width:min(440px,100%); background:#fff; border-radius:14px;
      box-shadow:0 18px 55px rgba(0,0,0,.35); overflow:hidden;
      font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
    }
    .ve-modal-header{
      padding:14px 16px; background:#111827; color:#fff;
      display:flex; align-items:center; justify-content:space-between; gap:12px;
    }
    .ve-modal-title{font-weight:700; font-size:14px;}
    .ve-x{
      border:0; background:transparent; color:#fff; font-size:18px; cursor:pointer;
      line-height:1; padding:6px 8px; border-radius:8px;
    }
    .ve-modal-body{padding:16px;}
    .ve-help{font-size:13px; color:#374151; margin:0 0 12px 0;}
    .ve-field-label{display:block; font-size:13px; color:#374151; margin-bottom:8px;}
    .ve-input{
      width:100%; padding:12px 12px; border:1px solid #d1d5db; border-radius:10px;
      font-size:16px; outline:none;
    }
    .ve-input:focus{border-color:#6b7280;}
    .ve-actions{display:flex; gap:10px; margin-top:12px;}
    .ve-action{
      flex:1; padding:12px 12px; border-radius:10px; border:0; cursor:pointer;
      font-weight:700; font-size:14px;
    }
    .ve-primary{background:#111827; color:#fff;}
    .ve-secondary{background:#f3f4f6; color:#111827;}
    .ve-error{
      margin-top:12px; background:#fef2f2; border:1px solid #fecaca; color:#991b1b;
      padding:10px 12px; border-radius:10px; font-size:13px; display:none; white-space:pre-line;
    }

    .ve-float{
      position:fixed;
      right:${CONFIG.ui.buttonRightPx}px;
      bottom:calc(${CONFIG.ui.buttonBottomPx}px + 56px);
      z-index:2147483647;
      width:${CONFIG.ui.iframeWidthPx}px; height:${CONFIG.ui.iframeHeightPx}px;
      min-width:${CONFIG.ui.iframeMinWidthPx}px; min-height:${CONFIG.ui.iframeMinHeightPx}px;
      background:#fff; border-radius:14px; box-shadow:0 18px 55px rgba(0,0,0,.35);
      overflow:hidden; display:flex; flex-direction:column; resize:both;
    }
    .ve-float.hidden{display:none;}
    .ve-float-bar{
      height:44px; background:#111827; color:#fff;
      display:flex; align-items:center; justify-content:space-between;
      padding:0 10px; cursor:move; user-select:none; gap:8px; flex:0 0 auto;
    }
    .ve-float-title{font-size:13px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
    .ve-float-controls{display:flex; gap:6px;}
    .ve-float-ctrl{
      border:0; background:rgba(255,255,255,.12); color:#fff;
      padding:6px 10px; border-radius:10px; cursor:pointer; font-weight:700; font-size:12px;
    }
    .ve-iframe{width:100%; height:100%; border:0; display:block; flex:1 1 auto; background:#000;}
  `);

  const state = {
    btn: null,
    modalBackdrop: null,
    floatBox: null,
    iframe: null,
    dragging: false,
    drag: { startX: 0, startY: 0, startRight: 0, startBottom: 0 },
    isOpen: false,
  };

  function init() {
    createButton();
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closePinModal();
    });
  }

  function createButton() {
    const btn = document.createElement("button");
    btn.className = "ve-pin-btn";
    btn.textContent = CONFIG.ui.joinText;

    btn.addEventListener("click", () => {
      if (state.isOpen) {
        closeFloatingIframe();
        setButtonState(false);
      } else {
        openPinModal();
      }
    });

    document.documentElement.appendChild(btn);
    state.btn = btn;
  }

  function setButtonState(open) {
    state.isOpen = open;
    if (state.btn) state.btn.textContent = open ? CONFIG.ui.closeText : CONFIG.ui.joinText;
  }

  function openPinModal() {
    closePinModal();

    const backdrop = document.createElement("div");
    backdrop.className = "ve-modal-backdrop";

    const modal = document.createElement("div");
    modal.className = "ve-modal";
    modal.innerHTML = `
      <div class="ve-modal-header">
        <div class="ve-modal-title">Enter PIN</div>
        <button class="ve-x" aria-label="Close">✕</button>
      </div>
      <div class="ve-modal-body">
        <p class="ve-help">Enter the PIN you were given over the phone to join the video call.</p>
        <label class="ve-field-label" for="ve-pin-input">PIN</label>
        <input id="ve-pin-input" class="ve-input" autocomplete="one-time-code" placeholder="e.g. AB12CD" />
        <div class="ve-actions">
          <button class="ve-action ve-secondary" id="ve-cancel">Cancel</button>
          <button class="ve-action ve-primary" id="ve-join">Join</button>
        </div>
        <div class="ve-error" id="ve-error"></div>
      </div>
    `;

    backdrop.appendChild(modal);
    document.documentElement.appendChild(backdrop);
    state.modalBackdrop = backdrop;

    const close = () => closePinModal();
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
    modal.querySelector(".ve-x").addEventListener("click", close);
    modal.querySelector("#ve-cancel").addEventListener("click", close);

    const input = modal.querySelector("#ve-pin-input");
    const joinBtn = modal.querySelector("#ve-join");
    const errBox = modal.querySelector("#ve-error");

    const setBusy = (busy) => {
      joinBtn.disabled = busy;
      if (state.btn) state.btn.disabled = busy;
      joinBtn.textContent = busy ? "Validating..." : "Join";
    };

    const submit = async () => {
      errBox.style.display = "none";
      const pin = sanitizePin(input.value);

      const pinErr = validatePinFormat(pin);
      if (pinErr) return showError(errBox, pinErr);

      setBusy(true);
      try {
        const shortUrl = await fetchShortUrlByPin(pin);
        closePinModal();
        openFloatingIframe(shortUrl);
        setButtonState(true);
      } catch (e) {
        showError(errBox, humanizeError(e));
      } finally {
        setBusy(false);
      }
    };

    joinBtn.addEventListener("click", submit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
      if (e.key === "Escape") close();
    });

    setTimeout(() => input.focus(), 50);
  }

  function closePinModal() {
    if (state.modalBackdrop) {
      state.modalBackdrop.remove();
      state.modalBackdrop = null;
    }
  }

  function showError(errBox, msg) {
    errBox.textContent = msg;
    errBox.style.display = "block";
  }

  function sanitizePin(v) {
    return (v || "").trim();
  }

  function validatePinFormat(pin) {
    if (!pin) return "Please enter a PIN.";
    if (pin.length < CONFIG.pin.minLen) return `PIN must be at least ${CONFIG.pin.minLen} characters.`;
    if (pin.length > CONFIG.pin.maxLen) return `PIN must be at most ${CONFIG.pin.maxLen} characters.`;
    if (CONFIG.pin.allowOnlyDigits && !/^\d+$/.test(pin)) return "PIN must contain digits only.";
    return null;
  }

  function buildEndpoint(pin) {
    const path = CONFIG.endpointTemplate.replace("{pin}", encodeURIComponent(pin));
    return new URL(path, CONFIG.apiBase).toString();
  }

  function fetchShortUrlByPin(pin) {
    const url = buildEndpoint(pin);

    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url,
        headers: { "Accept": "application/json" },
        timeout: 20000,

        onload: (resp) => {
          const status = resp.status || 0;
          const text = resp.responseText || "";

          // Try parse JSON if any
          let json = null;
          if (text) {
            try { json = JSON.parse(text); } catch (_) { /* ignore */ }
          }

          if (status >= 200 && status < 300) {
            const shortUrlRaw = json?.shortUrl;
            if (!shortUrlRaw || typeof shortUrlRaw !== "string") {
              return reject(new Error("PIN is valid, but API response did not include shortUrl."));
            }
            // If shortUrl is relative, resolve it against configured base
            const shortUrl = new URL(shortUrlRaw, CONFIG.shortUrlBase).toString();
            return resolve(shortUrl);
          }

          if (status === 404) return reject(new Error("PIN not found. Please verify the PIN and try again."));
          if (status === 400) {
            const msg = json?.err || "PIN expired. Please request a new PIN.";
            return reject(new Error(msg));
          }

          const fallbackMsg =
            json?.err ||
            json?.message ||
            `PIN validation failed (HTTP ${status}).`;
          return reject(new Error(fallbackMsg));
        },

        ontimeout: () => reject(new Error("PIN validation timed out. Please try again.")),
        onerror: () => reject(new Error("Network error calling PIN validation service.")),
      });
    });
  }

  function humanizeError(e) {
    return (e && e.message) ? e.message : "Something went wrong validating the PIN.";
  }

  function ensureFloatingShell() {
    if (state.floatBox && state.iframe) return;

    const box = document.createElement("div");
    box.className = "ve-float hidden";

    const bar = document.createElement("div");
    bar.className = "ve-float-bar";
    bar.innerHTML = `
      <div class="ve-float-title" title="VideoEngager">VideoEngager</div>
      <div class="ve-float-controls">
        <button class="ve-float-ctrl" data-action="min">Minimize</button>
        <button class="ve-float-ctrl" data-action="close">Close</button>
      </div>
    `;

    const iframe = document.createElement("iframe");
    iframe.className = "ve-iframe";
    iframe.allow = "camera; microphone; fullscreen; autoplay; clipboard-read; clipboard-write";
    iframe.referrerPolicy = "no-referrer-when-downgrade";

    box.appendChild(bar);
    box.appendChild(iframe);
    document.documentElement.appendChild(box);

    bar.querySelector('[data-action="close"]').addEventListener("click", () => {
      closeFloatingIframe();
      setButtonState(false);
    });

    bar.querySelector('[data-action="min"]').addEventListener("click", () => toggleMinimize(box));

    bar.addEventListener("mousedown", (e) => startDrag(e, box));
    window.addEventListener("mousemove", (e) => onDrag(e, box));
    window.addEventListener("mouseup", endDrag);

    state.floatBox = box;
    state.iframe = iframe;
  }

  function toggleMinimize(box) {
    const isMin = box.getAttribute("data-minimized") === "1";
    if (!isMin) {
      box.setAttribute("data-prev-height", box.style.height || "");
      box.style.height = "44px";
      box.setAttribute("data-minimized", "1");
    } else {
      const prev = box.getAttribute("data-prev-height") || "";
      box.style.height = prev || `${CONFIG.ui.iframeHeightPx}px`;
      box.setAttribute("data-minimized", "0");
    }
  }

  function openFloatingIframe(url) {
    ensureFloatingShell();
    state.iframe.src = url;
    state.floatBox.classList.remove("hidden");
    state.floatBox.style.zIndex = "2147483647";
  }

  function closeFloatingIframe() {
    if (!state.floatBox || !state.iframe) return;
    state.iframe.src = "about:blank";
    state.floatBox.classList.add("hidden");
    state.floatBox.removeAttribute("data-minimized");
  }

  function startDrag(e, box) {
    if (e.button !== 0) return;
    state.dragging = true;

    const computed = window.getComputedStyle(box);
    const right = parseInt(computed.right, 10) || 0;
    const bottom = parseInt(computed.bottom, 10) || 0;

    state.drag.startX = e.clientX;
    state.drag.startY = e.clientY;
    state.drag.startRight = right;
    state.drag.startBottom = bottom;

    e.preventDefault();
  }

  function onDrag(e, box) {
    if (!state.dragging) return;

    const dx = e.clientX - state.drag.startX;
    const dy = e.clientY - state.drag.startY;

    let newRight = state.drag.startRight - dx;
    let newBottom = state.drag.startBottom - dy;

    newRight = clamp(newRight, 0, window.innerWidth - 80);
    newBottom = clamp(newBottom, 0, window.innerHeight - 44);

    box.style.right = `${newRight}px`;
    box.style.bottom = `${newBottom}px`;
  }

  function endDrag() {
    state.dragging = false;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
