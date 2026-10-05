// DOM and iframe handling live here; SDK calls live in app.js.
window.createKioskUI = function (config) {
  const elements = Object.fromEntries(['status', 'welcome', 'start', 'session', 'waiting',
    'video-stage', 'video-container', 'end', 'survey-done', 'error', 'error-message', 'retry']
    .map(id => [id, document.getElementById(id)]));
  const container = elements['video-container'];
  elements.waiting.tabIndex = -1;
  const waiting = window.createKioskWaitingScreen(elements.waiting, config.waitingScreen !== false);
  const overlayMode = (config.waitingScreenMode || 'overlay') === 'overlay';
  let phase = 'loading';
  let precall = false;
  let retainSurvey = false;
  let status = '';
  let expansion;

  function updateWaiting() {
    const findingAgent = ['starting', 'waiting'].includes(phase);
    const overlay = config.waitingScreen !== false && overlayMode && findingAgent && !precall;
    const focusCovered = overlay && document.activeElement === container.querySelector('iframe');
    document.body.classList.toggle('waiting-overlay', overlay);
    container.inert = overlay;
    waiting.setCompact(!overlayMode && !container.hidden);
    if (findingAgent && precall) waiting.hide(false);
    else if (['authenticating', 'starting', 'waiting', 'ending'].includes(phase)) {
      waiting.show(status, findingAgent);
    }
    else waiting.hide();
    if (focusCovered) (elements.end.disabled ? elements.waiting : elements.end).focus();
  }

  function removeIframe() {
    precall = false;
    container.replaceChildren();
    container.hidden = true;
    updateWaiting();
  }

  function setStatus(message) {
    status = message;
    elements.status.textContent = message;
    updateWaiting();
  }

  function show(next, message, canEnd = false) {
    const stage = elements['video-stage'];
    const moveFocus = next === 'active' && elements.waiting.contains(document.activeElement);
    const animate = next === 'active' && phase !== 'active' && stage.animate &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const before = animate ? stage.getBoundingClientRect() : null;
    if (next !== 'active') expansion?.cancel();
    phase = next;
    if (!['starting', 'waiting'].includes(next)) precall = false;
    document.body.classList.toggle('call-active', next === 'active');
    if (next === 'ready') {
      retainSurvey = false;
      removeIframe();
    }
    if (next === 'ending') container.hidden = true;
    elements.welcome.hidden = !['loading', 'ready'].includes(next);
    elements.session.hidden = !['authenticating', 'starting', 'waiting', 'active', 'ending', 'survey'].includes(next);
    elements.error.hidden = next !== 'error';
    elements.start.disabled = next !== 'ready';
    elements.end.disabled = !canEnd;
    elements.end.hidden = next === 'survey';
    elements.end.textContent = next === 'active' ? 'End call' : 'Cancel request';
    elements['survey-done'].hidden = next !== 'survey';
    if (next === 'survey') container.hidden = false;
    if (next === 'error') {
      elements['error-message'].textContent = message;
    }
    setStatus(message);
    if (before && before.width && before.height) {
      const after = stage.getBoundingClientRect();
      // Animate the existing iframe's container; never reparent or reload the live call.
      expansion = stage.animate([
        { transform: `translate(${before.left - after.left}px, ${before.top - after.top}px) scale(${before.width / after.width}, ${before.height / after.height})`, borderRadius: '20px' },
        { transform: 'none', borderRadius: '0px' }
      ], { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    }
    if (next === 'ready') elements.start.focus();
    if (moveFocus) (canEnd ? elements.end : container.querySelector('iframe'))?.focus();
    if (next === 'starting' || next === 'authenticating') elements.waiting.focus();
    if (next === 'waiting' && document.activeElement === elements.waiting) elements.end.focus();
    if (next === 'error') elements.retry.focus();
    if (next === 'survey') elements['survey-done'].focus();
  }

  // Experimental: this private postRobot precall event format is expected to change.
  // Replace this bridge when Core exposes a supported precall lifecycle event.
  window.addEventListener('message', event => {
    if (!overlayMode || !['starting', 'waiting'].includes(phase)) return;
    const iframe = container.querySelector('iframe');
    if (!iframe || event.source !== iframe.contentWindow || event.origin !== new URL(iframe.src).origin) return;
    let data = event.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { return; }
    }
    const name = data?.__postRobot__?.name;
    if (name === 'VideoEngager.event:PreCallStarted') {
      const moveFocus = elements.waiting.contains(document.activeElement);
      precall = true;
      updateWaiting();
      if (moveFocus) iframe.focus();
    } else if (name === 'VideoEngager.event:PreCallFinished' && precall) {
      precall = false;
      updateWaiting();
    }
  });

  return {
    show,
    setStatus,
    setSurveyRetention(value) { retainSurvey = value; },
    hasIframe: () => !!container.querySelector('iframe'),
    removeIframe,
    callbacks: {
      createIframe(src) {
        removeIframe();
        const iframe = document.createElement('iframe');
        iframe.title = 'Video assistance call';
        iframe.allow = 'camera; microphone; display-capture; autoplay; fullscreen';
        iframe.src = src;
        container.append(iframe);
        // Core may finish startup before its queued end runs. Keep that iframe out of the ending screen.
        container.hidden = phase === 'ending';
        updateWaiting();
        return iframe;
      },
      getIframeInstance: () => container.querySelector('iframe'),
      destroyIframe() { if (!retainSurvey) removeIframe(); },
      setIframeVisibility(visible) {
        if (!visible && retainSurvey) return;
        container.hidden = !visible || phase === 'ending';
        updateWaiting();
      }
    },
    onStart(fn) { elements.start.addEventListener('click', fn); },
    onEnd(fn) { elements.end.addEventListener('click', fn); },
    onRetry(fn, label) { elements.retry.textContent = label; elements.retry.addEventListener('click', fn); },
    onSurveyDone(fn) { elements['survey-done'].addEventListener('click', fn); }
  };
};
