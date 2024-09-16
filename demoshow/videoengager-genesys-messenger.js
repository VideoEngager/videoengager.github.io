/**
 * Video Engager Widget with Genesys Messenger.
 * @class
 * This class will load Genesys widget and after that it will initialize the Video Engager Widget.
 * @example
 * const videoEngagerInstance = VideoEngagerWidget.initializeVeGensysMessaging({
 *  TENANT_ID: 'your_tenant_id',
 * veUrl: 'https://your_ve_url',
 * environment: 'your_environment',
 * deploymentId: 'your_deployment_id',
 * envUrl: 'your_env_url',
  * });
 *
 */
class VideoEngagerWidget {
/**
   * Initializes the Genesys messaging service and returns an instance of VideoEngagerWidget.
   * @param {Object} options - The options for initialization.
   * @param {string} options.TENANT_ID - The tenant ID.
   * @param {string} options.veUrl - The video engagement URL.
   * @param {Object} [options.customAttributes={}] - Custom attributes for the session.
   * @param {boolean} [options.autoAccept=true] - Whether to auto-accept the call.
   * @param {string} options.environment - The Genesys environment.
   * @param {string} options.deploymentId - The deployment ID.
   * @param {string} options.envUrl - The environment URL.
   * @param {boolean} [options.debug=false] - Enable debug mode.
   * @param {boolean} [options.audioOnly=false] - Whether to start the call with audio only.
   * @returns {VideoEngagerWidget} An instance of VideoEngagerWidget.
   */
  static initializeVeGensysMessaging ({
    TENANT_ID,
    veUrl,
    customAttributes = {},
    autoAccept = true,
    environment,
    deploymentId,
    envUrl,
    debug = false,
    audioOnly = false
  } = {}) {
    loadGenesysWidget(window, 'Genesys', `${envUrl}/genesys-bootstrap/genesys.min.js`, {
      deploymentId,
      environment,
      debug
    });

    const videoEngagerInstance = new VideoEngagerWidget({
      TENANT_ID,
      veUrl,
      customAttributes,
      autoAccept,
      audioOnly
    });

    return videoEngagerInstance;
  }

  /**
   * Creates an instance of VideoEngagerWidget.
   * @param {Object} options - The options for the widget.
   * @param {string} options.TENANT_ID - The tenant ID.
   * @param {string} options.veUrl - The video engagement URL.
   * @param {Object} options.customAttributes - Custom attributes for the session.
   * @param {boolean} options.autoAccept - Whether to auto-accept the call.
   */
  constructor ({ TENANT_ID, veUrl, customAttributes, autoAccept, audioOnly } = {}) {
    /**
     * @private
     */
    this.autoAccept = autoAccept;
    /**
     * @private
     */
    this.iframeInstance = null;
    /**
     * @private
     */
    this.callIsActive = false;
    /**
     * @private
     */
    this.interactionId = null;
    /**
     * @private
     */
    this.veUrl = veUrl;
    /**
     * @private
     */
    this.TENANT_ID = TENANT_ID;
    /**
     * @private
     */
    this.customAttributes = customAttributes;
    // Call the function to inject the styles
    injectStyles();
    // Call the function to inject the HTML
    const { windowContent, windowDiv, launcherBtn, endBtn, minimizeBtn } = safelyInjectHtml();
    /**
     * @private
     */
    this.startWithVideo = !audioOnly;
    /**
     * @private
     */
    this.launcherBtn = launcherBtn;
    /**
     * @private
     */
    this.iframeHolder = windowContent;
    /**
     * @private
     */
    this.movableWindow = windowDiv;
    /**
    * @private
    */
    this.minimizeBtn = minimizeBtn;
    /**
     * @private
     */
    this.endBtn = endBtn;
    /**
     * @private
     */
    /**
     * @private
     * this indicates that gensys messenger plugin is loaded
     */
    this.GenesysVendorsReady = false;
    this.registerButtonsListeners();
    this.registerWindowListeners();
    this.registerGensysListeners();
  }

  /**
   * @private
   */
  registerButtonsListeners () {
    const self = this;
    this.launcherBtn.addEventListener('click', () => {
      self.startGenesysVideoSession();
    });
    this.endBtn.addEventListener('click', () => {
      console.log('VideoEngagerWidget: endBtn clicked');
      self.stopGenesysVideoSession();
    });
    this.minimizeBtn.addEventListener('click', function () {
      self.movableWindow.style.display = 'none';
      self.showLauncher();
    });
  }

  /**
   * @private
   */
  registerWindowListeners () {
    const self = this;
    // terminate call on page close
    window.onbeforeunload = async () => {
      if (!this.isCallOngoing) return;
      await self.stopGenesysVideoSession();
    };
    window.addEventListener('message', async (e) => {
      if (e.data.type === 'popupClosed') {
        console.log('VideoEngagerWidget: popupClosed');
        await self.stopGenesysVideoSession();
      }
      if (e.data.type === 'callEnded') {
        console.log('VideoEngagerWidget: callEnded');
        await self.stopGenesysVideoSession();
      }
    });
  }

  /**
   * @private
   */
  registerGensysListeners () {
    const self = this;
    window.Genesys('subscribe', 'Launcher.ready', function () {
      self.showLauncher();
    });
    // this will be triggerred only if disconnect is initiated by agent or flow
    window.Genesys('subscribe', 'MessagingService.conversationDisconnected', (e) => {
      console.log('VideoEngagerWidget: conversationDisconnected', e);
      self.stopGenesysVideoSession(false);
    });
    // this will be triggerred only if disconnect if conversation is ended (in read only mode)
    window.Genesys('subscribe', 'MessagingService.readOnlyConversation', function (e) {
      console.log('VideoEngagerWidget: readOnlyConversation', e);
      self.stopGenesysVideoSession(false);
    });

    window.Genesys('subscribe', 'MessagingService.conversationCleared', function (e) {
      console.log('VideoEngagerWidget: conversationCleared', e);
      self.stopGenesysVideoSession(false);
    });
    window.Genesys('subscribe', 'GenesysVendors.ready', () => {
      self.GenesysVendorsReady = true;
    });
  }

  /**
   * Stops the current video session and Optionally sends a message to the agent.
   * @param {boolean} [sendMessage=true] - Whether to inform the agent about the session end.
   * @returns {Promise<void>} A promise that resolves when the session is stopped.
   */
  async stopGenesysVideoSession (sendMessage = true) {
    if (this.stoppingGenesysVideoSession) {
      console.error('VideoEngagerWidget: already stopping video session');
      return;
    }
    this.stoppingGenesysVideoSession = true;
    await PromiseGenesys('command', 'Database.update', {
      messaging: {
        customAttributes: {
          'context.veVisitorId': '0'
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 300)); // wait for the database update to take effect

    if (sendMessage) {
      await PromiseGenesys('command', 'MessagingService.sendMessage', {
        message: 'Remove Video Session'
      });
    }

    this.stopVideo();
    this.stoppingGenesysVideoSession = false;
  }

  /**
   * Displays the launcher button.
   */
  showLauncher () {
    this.launcherBtn.style.display = 'flex';
  }

  /**
   * Hides the launcher button.
   */
  hideLauncher () {
    this.launcherBtn.style.display = 'none';
  }

  /**
   * Displays the video iframe widget.
   */
  showWidget () {
    this.movableWindow.style.display = 'flex';
    this.launcherBtn.style.display = 'none';
  }

  /**
   * Hides the video iframe widget.
   */
  hideWidget () {
    this.movableWindow.style.display = 'none';
    this.launcherBtn.style.display = 'flex';
  }

  /**
   * Checks if a video call is ongoing.
   * @returns {boolean} True if a call is ongoing, false otherwise.
   */
  get isCallOngoing () {
    if (this.iframeInstance) {
      return true;
    }

    return false;
  }

  /**
   * Prepares the interaction ID for a video call.
   * Should always be called before starting a video call.
   * @returns {string} The generated interaction ID.
   */
  prepareVideoCall () {
    this.interactionId = getGuid();
    return this.interactionId;
  }

  /**
   * @private
   * Initializes the Genesys Messenger service.
   * @returns {Promise<void>} A promise that resolves when the Messenger is ready.
   * Trying to initialize video call (send message) before this will cause an error.
   */
  async initializeMessenger () {
    return new Promise((resolve, reject) => {
      // GenesysVendors
      window.Genesys('subscribe', 'GenesysVendors.ready', () => {
        resolve();
      });

      PromiseGenesys('command', 'Messenger.openConversation', {})
        .catch(e => {
          console.error('VideoEngagerWidget: error while opening messenger', e);
          reject(e);
        });
    });
  }

  /**
   * Starts a Genesys interaction chat and video call session.
   * If a call is already ongoing, this method will show the widget.
   * @returns {Promise<void>} A promise that resolves when the session is started.
   * @example
   * videoEngagerInstance.startGenesysVideoSession();
   *
   */
  async startGenesysVideoSession () {
    if (this.isCallOngoing) {
      this.showWidget();
      console.error('VideoEngagerWidget: Call is already ongoing');
      return;
    }

    if (this.startingGenesysVideoSession) {
      console.error('VideoEngagerWidget: already stopping video session');
      return;
    }
    this.startingGenesysVideoSession = true;
    const interactionId = this.prepareVideoCall();
    // ve-launcher
    // await PromiseGenesys('command', 'Messenger.open', {})
    //   .catch(e => console.error('VideoEngagerWidget: error while opening messenger', e));
    if (!this.GenesysVendorsReady) {
      await this.initializeMessenger();
    }
    // await new Promise(resolve => setTimeout(resolve, 600));
    await sendStartVideoSessionMessage(interactionId);
    this.startVideo();
    this.startingGenesysVideoSession = false;
  }

  /**
  * @private
   * Starts the video session by creating and displaying an iframe.
   * @returns {string|null} The interaction ID or null if the session is already ongoing.
   */
  startVideo () {
    let str = {
      sessionId: this.interactionId,
      hideChat: true,
      type: 'initial',
      defaultGroup: 'floor',
      view_widget: '4',
      offline: true,
      aa: this.autoAccept,
      skip_private: true,
      inichat: 'false'
    };
    if (this.customAttributes) {
      str = Object.assign(str, this.customAttributes);
    }
    if (!this.startWithVideo) {
      str.video_on = 'false';
    }
    const encodedString = window.btoa(JSON.stringify(str));
    const homeURL = this.veUrl + '/static/';
    const url = `${homeURL}popup.html?tennantId=${window.btoa(this.TENANT_ID)}&params=${encodedString}`;

    this.iframeInstance = document.createElement('iframe');
    this.iframeInstance.width = '100%';
    this.iframeInstance.height = '100%';
    this.iframeInstance.id = 'videoengageriframe';
    this.iframeInstance.allow = 'microphone; camera';
    this.iframeInstance.src = url;
    this.iframeHolder.querySelectorAll('iframe').forEach(e => e.remove());
    this.iframeHolder.appendChild(this.iframeInstance);
    this.iframeHolder.style.display = 'block';
    this.showWidget();
    return this.interactionId;
  }

  /**
   * @private
   * Stops the video session by closing the iframe.
   */
  stopVideo () {
    this.closeIframe();
  }

  /**
   * @private
   * Closes the iframe and resets the video session state.
   */
  closeIframe () {
    this.interactionId = null;
    if (this.iframeHolder.getElementsByTagName('iframe')[0]) {
      this.iframeHolder.removeChild(this.iframeHolder.getElementsByTagName('iframe')[0]);
    }
    this.iframeInstance = null;
    this.iframeHolder.style.display = 'none';
    this.hideWidget();
  }
}
/**
 * Sends a command to Genesys and returns a promise.
 * @param {string} command - The Genesys command.
 * @param {string} action - The action to perform.
 * @param {Object} payload - The payload for the command.
 * @returns {Promise<Object>} A promise that resolves with the command response.
 */
function PromiseGenesys (command, action, payload) {
  return new Promise((resolve, reject) => {
    try {
      window.Genesys(command, action, payload, response => {
        resolve(response);
      }, err => {
        console.error('VideoEngagerWidget: ', err);
        reject(err);
      });
    } catch (e) {
      console.error('VideoEngagerWidget: Promise Error:', e);
      reject(e);
    }
  });
}
/**
 * Sends a message to start a video session.
 * @param {string} interactionId - The interaction ID.
 */
async function sendStartVideoSessionMessage (interactionId) {
  try {
    await PromiseGenesys('command', 'Database.update', {
      messaging: {
        customAttributes: {
          'context.veVisitorId': interactionId
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 300)); // wait for the database update to take effect
    await PromiseGenesys('command', 'MessagingService.sendMessage', {
      message: 'Start Video Session'
    });
  } catch (e) {
    console.log('VideoEngagerWidget: error while sending start video session message', e);

    if (e === 'Conversation session has ended, start a new session to send a message.') {
      await PromiseGenesys('command', 'MessagingService.resetConversation', {})
        .catch(e => console.error('VideoEngagerWidget: error while clearing conversation', e));
      await PromiseGenesys('command', 'MessagingService.sendMessage', {
        message: 'Start Video Session'
      });
    }
  }
}

function loadGenesysWidget (g, e, n, es, ys) {
  g._genesysJs = e; g[e] = g[e] || function () { (g[e].q = g[e].q || []).push(arguments); };
  g[e].t = 1 * new Date(); g[e].c = es; ys = document.createElement('script'); ys.async = 1;
  ys.src = n; ys.charset = 'utf-8'; document.head.appendChild(ys);
}

window.VideoEngagerWidget = VideoEngagerWidget;
/**
 * Helper functions
 */

function injectStyles () {
  // Create a style element
  const style = document.createElement('style');
  style.type = 'text/css';

  // Define the CSS styles as a string
  const css = '#ve-launcher{z-index: 999991;background-color:#00f;fill:white;position:fixed;bottom:14px;left:14px;transition:.3s ease-in-out;border-radius:9999px;padding:12px!important;width:48px;height:48px}#ve-launcher:disabled{background-color:gray!important;fill:white;pointer-events:none;cursor:not-allowed}#ve-launcher:hover{background-color:#00008b}#ve-launcher[data-state=active]{background-color:red}#ve-launcher[data-state=active]:hover{background-color:#8b0000}#ve-launcher[data-state=active]>#ve-video-icon,#ve-launcher[data-state=inactive]>#ve-active-indicator{display:none}.window{width:400px;height:600px;position:fixed;background-color:#fff;box-shadow:2px 2px 10px rgba(0,0,0,.2);z-index:999999992;top:0;left:0;overflow:hidden;display:flex;flex-direction:column;border-radius:10px}.window-content{flex-grow:1}.window-header{background-color:#007bff;color:#fff;padding:0 0 0 10px;cursor:move;display:flex;justify-content:space-between;align-items:center}@media screen and (max-width:768px){.resize-btn{display:none}}button{border:none;cursor:pointer;display:flex;align-items:center;justify-content:center}#ve-action-buttons{display:flex;gap:5px}#ve-action-buttons>button{background:0 0;border:rgba(156,156,156,.5);padding-block:5px;padding-inline:15px}#ve-action-buttons>button:hover{background:rgba(255,255,255,.312)}';

  // Add the CSS string to the style element
  if (style.styleSheet) {
    style.styleSheet.cssText = css; // For older versions of IE
  } else {
    style.appendChild(document.createTextNode(css)); // Standard method
  }

  // Append the style element to the head of the document
  document.head.appendChild(style);
}

function getGuid () {
  function s4 () {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function safelyInjectHtml () {
  // Create the main container
  const windowDiv = document.createElement('div');
  windowDiv.className = 'window';
  windowDiv.style.display = 'none';
  // Create the window header
  const windowHeader = document.createElement('div');
  windowHeader.className = 'window-header';

  // Create the window title
  const windowTitle = document.createElement('span');
  windowTitle.className = 'window-title';
  windowTitle.textContent = 'VideoEngager';

  // Create the action buttons container
  const actionButtons = document.createElement('div');
  actionButtons.id = 've-action-buttons';
  actionButtons.style.fill = 'white';

  // Create minimize button with SVG
  const minimizeBtn = document.createElement('button');
  minimizeBtn.className = 'minimize-btn';
  const minimizeSvg = createSvgElement('M6.25 11H18.75C19.4375 11 20 11.45 20 12C20 12.55 19.4375 13 18.75 13H6.25C5.5625 13 5 12.55 5 12C5 11.45 5.5625 11 6.25 11Z');
  minimizeBtn.appendChild(minimizeSvg);

  // Create resize button with SVG
  const resizeBtn = document.createElement('button');
  resizeBtn.className = 'resize-btn';
  const resizeSvg = createSvgElement('M6 14C5.45 14 5 14.45 5 15V18C5 18.55 5.45 19 6 19H9C9.55 19 10 18.55 10 18C10 17.45 9.55 17 9 17H7V15C7 14.45 6.55 14 6 14ZM6 10C6.55 10 7 9.55 7 9V7H9C9.55 7 10 6.55 10 6C10 5.45 9.55 5 9 5H6C5.45 5 5 5.45 5 6V9C5 9.55 5.45 10 6 10ZM17 17H15C14.45 17 14 17.45 14 18C14 18.55 14.45 19 15 19H18C18.55 19 19 18.55 19 18V15C19 14.45 18.55 14 18 14C17.45 14 17 14.45 17 15V17ZM14 6C14 6.55 14.45 7 15 7H17V9C17 9.55 17.45 10 18 10C18.55 10 19 9.55 19 9V6C19 5.45 18.55 5 18 5H15C14.45 5 14 5.45 14 6Z');
  resizeBtn.appendChild(resizeSvg);

  // Create end button with SVG
  const endBtn = document.createElement('button');
  endBtn.className = 'end-btn';
  const endSvg = createSvgElement('M4.51077 15.4794L6.51077 13.8894C6.99077 13.5094 7.27077 12.9294 7.27077 12.3194V9.71938C10.2908 8.73938 13.5608 8.72938 16.5908 9.71938V12.3294C16.5908 12.9394 16.8708 13.5194 17.3508 13.8994L19.3408 15.4794C20.1408 16.1094 21.2808 16.0494 22.0008 15.3294L23.2208 14.1094C24.0208 13.3094 24.0208 11.9794 23.1708 11.2294C16.7608 5.56938 7.10077 5.56938 0.690767 11.2294C-0.159233 11.9794 -0.159233 13.3094 0.640767 14.1094L1.86077 15.3294C2.57077 16.0494 3.71077 16.1094 4.51077 15.4794Z');
  endSvg.setAttribute('fill', 'rgb(213, 0, 0)');
  endBtn.appendChild(endSvg);

  // Append buttons to the action buttons container
  actionButtons.appendChild(minimizeBtn);
  actionButtons.appendChild(resizeBtn);
  actionButtons.appendChild(endBtn);

  // Append title and action buttons to the header
  windowHeader.appendChild(windowTitle);
  windowHeader.appendChild(actionButtons);

  // Create the window content
  const windowContent = document.createElement('div');
  windowContent.className = 'window-content';
  // Content can be added dynamically if needed

  // Append header and content to the main container
  windowDiv.appendChild(windowHeader);
  windowDiv.appendChild(windowContent);

  // Create the launcher button with SVG
  const launcherBtn = document.createElement('button');
  launcherBtn.style.display = 'none';
  launcherBtn.id = 've-launcher';
  launcherBtn.setAttribute('data-state', 'inactive');
  const launcherIndicator = document.createElement('span');
  launcherIndicator.id = 've-active-indicator';
  launcherIndicator.style.width = '10px';
  launcherIndicator.style.height = '10px';
  launcherIndicator.style.background = 'rgb(0, 123, 255)';
  launcherIndicator.style.position = 'absolute';
  launcherIndicator.style.top = '0px';
  launcherIndicator.style.right = '0px';
  launcherIndicator.style.borderRadius = '199px';
  launcherBtn.appendChild(launcherIndicator);

  const launcherSvg = createSvgElement('M17 10.5V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L19.29 15.79C19.92 16.42 21 15.97 21 15.08V8.91C21 8.02 19.92 7.57 19.29 8.2L17 10.5Z');
  launcherBtn.appendChild(launcherSvg);

  // Append the main container and launcher button to the body or a specific container
  document.body.appendChild(windowDiv);
  document.body.appendChild(launcherBtn);
  registerUILogic();
  return { windowContent, windowDiv, launcherBtn, endBtn, minimizeBtn };
}
function registerUILogic () {
  let isFullScreen = false;
  // set html to 100% height
  document.getElementsByTagName('html')[0].style.height = '100%';
  const originalWidth = '400px';
  const originalHeight = '600px';
  const originalX = 0;
  const originalY = 0;
  const draggie = new window.Draggabilly('.window', {
    containment: 'html'
  // options...
  });
  function isMobile () {
    return window.innerWidth <= 768;
  }

  function applyResponsiveBehavior () {
    const windowElement = document.querySelector('.window');

    if (windowElement) {
      if (isMobile()) {
        enterFullScreen(windowElement);
      } else {
        exitFullScreen(windowElement);
      }
    }
  }

  function enterFullScreen (windowElement) {
    isFullScreen = true;
    windowElement.style.width = '100vw';
    windowElement.style.height = '100vh';
    draggie.setPosition(0, 0);
    draggie.disable();
    document.getElementsByTagName('html')[0].style.overflow = 'hidden';
  }

  function exitFullScreen (windowElement) {
    draggie.enable();

    isFullScreen = false;
    windowElement.style.width = originalWidth;
    windowElement.style.height = originalHeight;
    // windowElement.style.transform = `translate(${originalX}px, ${originalY}px)`;
    draggie.setPosition(originalX, originalY);
    document.getElementsByTagName('html')[0].style.overflow = '';
  }

  document.querySelector('.resize-btn').addEventListener('click', function () {
    const windowElement = document.querySelector('.window');

    if (isFullScreen) {
      exitFullScreen(windowElement);
    } else {
      enterFullScreen(windowElement);
    }
  });

  // Initial behavior setup
  applyResponsiveBehavior();

  // Listen for screen resize and reapply behavior
  let isLastMobile = isMobile();
  window.addEventListener('resize', () => {
    const isMobileNow = isMobile();
    if (isMobileNow !== isLastMobile) {
      applyResponsiveBehavior();
      isLastMobile = isMobileNow;
    }
  });
}
// Helper function to create SVG elements
function createSvgElement (pathData) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('viewBox', '0 0 24 24');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);

  svg.appendChild(path);
  return svg;
}

/* interact.js 1.10.27 | https://raw.github.com/taye/interact.js/main/LICENSE */
/*!
 * Draggabilly PACKAGED v3.0.0
 * Make that shiz draggable
 * https://draggabilly.desandro.com
 * MIT license
 */
// eslint-disable-next-line
!function(t,i){"function"==typeof define&&define.amd?define(["jquery"],(function(e){return i(t,e)})):"object"==typeof module&&module.exports?module.exports=i(t,require("jquery")):t.jQueryBridget=i(t,t.jQuery)}(window,(function(t,i){"use strict";var e=Array.prototype.slice,n=t.console,o=void 0===n?function(){}:function(t){n.error(t)};function s(n,s,h){function a(t,i,e){var s,r="$()."+n+'("'+i+'")';return t.each((function(t,a){var d=h.data(a,n);if(d){var u=d[i];if(u&&"_"!=i.charAt(0)){var l=u.apply(d,e);s=void 0===s?l:s}else o(r+" is not a valid method")}else o(n+" not initialized. Cannot call methods, i.e. "+r)})),void 0!==s?s:t}function d(t,i){t.each((function(t,e){var o=h.data(e,n);o?(o.option(i),o._init()):(o=new s(e,i),h.data(e,n,o))}))}(h=h||i||t.jQuery)&&(s.prototype.option||(s.prototype.option=function(t){h.isPlainObject(t)&&(this.options=h.extend(!0,this.options,t))}),h.fn[n]=function(t){if("string"==typeof t){var i=e.call(arguments,1);return a(this,t,i)}return d(this,t),this},r(h))}function r(t){!t||t&&t.bridget||(t.bridget=s)}return r(i||t.jQuery),s})),
/*!
 * Infinite Scroll v2.0.4
 * measure size of elements
 * MIT license
 */
// eslint-disable-next-line
function(t,i){"object"==typeof module&&module.exports?module.exports=i():t.getSize=i()}(window,(function(){function t(t){let i=parseFloat(t);return-1==t.indexOf("%")&&!isNaN(i)&&i}let i=["paddingLeft","paddingRight","paddingTop","paddingBottom","marginLeft","marginRight","marginTop","marginBottom","borderLeftWidth","borderRightWidth","borderTopWidth","borderBottomWidth"];i.length;return function(e){if("string"==typeof e&&(e=document.querySelector(e)),!(e&&"object"==typeof e&&e.nodeType))return;let n=getComputedStyle(e);if("none"==n.display)return function(){let t={width:0,height:0,innerWidth:0,innerHeight:0,outerWidth:0,outerHeight:0};return i.forEach((i=>{t[i]=0})),t}();let o={};o.width=e.offsetWidth,o.height=e.offsetHeight;let s=o.isBorderBox="border-box"==n.boxSizing;i.forEach((t=>{let i=n[t],e=parseFloat(i);o[t]=isNaN(e)?0:e}));let r=o.paddingLeft+o.paddingRight,h=o.paddingTop+o.paddingBottom,a=o.marginLeft+o.marginRight,d=o.marginTop+o.marginBottom,u=o.borderLeftWidth+o.borderRightWidth,l=o.borderTopWidth+o.borderBottomWidth,c=t(n.width);!1!==c&&(o.width=c+(s?0:r+u));let p=t(n.height);return!1!==p&&(o.height=p+(s?0:h+l)),o.innerWidth=o.width-(r+u),o.innerHeight=o.height-(h+l),o.outerWidth=o.width+a,o.outerHeight=o.height+d,o}})),function(t,i){"object"==typeof module&&module.exports?module.exports=i():t.EvEmitter=i()}("undefined"!=typeof window?window:this,(function(){function t(){}let i=t.prototype;return i.on=function(t,i){if(!t||!i)return this;let e=this._events=this._events||{},n=e[t]=e[t]||[];return n.includes(i)||n.push(i),this},i.once=function(t,i){if(!t||!i)return this;this.on(t,i);let e=this._onceEvents=this._onceEvents||{};return(e[t]=e[t]||{})[i]=!0,this},i.off=function(t,i){let e=this._events&&this._events[t];if(!e||!e.length)return this;let n=e.indexOf(i);return-1!=n&&e.splice(n,1),this},i.emitEvent=function(t,i){let e=this._events&&this._events[t];if(!e||!e.length)return this;e=e.slice(0),i=i||[];let n=this._onceEvents&&this._onceEvents[t];for(let o of e){n&&n[o]&&(this.off(t,o),delete n[o]),o.apply(this,i)}return this},i.allOff=function(){return delete this._events,delete this._onceEvents,this},t})),
/*!
 * Unidragger v3.0.0
 * Draggable base class
 * MIT license
 */
// eslint-disable-next-line
function(t,i){"object"==typeof module&&module.exports?module.exports=i(t,require("ev-emitter")):t.Unidragger=i(t,t.EvEmitter)}("undefined"!=typeof window?window:this,(function(t,i){function e(){}let n,o,s=e.prototype=Object.create(i.prototype);s.handleEvent=function(t){let i="on"+t.type;this[i]&&this[i](t)},"ontouchstart"in t?(n="touchstart",o=["touchmove","touchend","touchcancel"]):t.PointerEvent?(n="pointerdown",o=["pointermove","pointerup","pointercancel"]):(n="mousedown",o=["mousemove","mouseup"]),s.touchActionValue="none",s.bindHandles=function(){this._bindHandles("addEventListener",this.touchActionValue)},s.unbindHandles=function(){this._bindHandles("removeEventListener","")},s._bindHandles=function(i,e){this.handles.forEach((o=>{o[i](n,this),o[i]("click",this),t.PointerEvent&&(o.style.touchAction=e)}))},s.bindActivePointerEvents=function(){o.forEach((i=>{t.addEventListener(i,this)}))},s.unbindActivePointerEvents=function(){o.forEach((i=>{t.removeEventListener(i,this)}))},s.withPointer=function(t,i){i.pointerId==this.pointerIdentifier&&this[t](i,i)},s.withTouch=function(t,i){let e;for(let t of i.changedTouches)t.identifier==this.pointerIdentifier&&(e=t);e&&this[t](i,e)},s.onmousedown=function(t){this.pointerDown(t,t)},s.ontouchstart=function(t){this.pointerDown(t,t.changedTouches[0])},s.onpointerdown=function(t){this.pointerDown(t,t)};const r=["TEXTAREA","INPUT","SELECT","OPTION"],h=["radio","checkbox","button","submit","image","file"];return s.pointerDown=function(t,i){let e=r.includes(t.target.nodeName),n=h.includes(t.target.type),o=!e||n;!this.isPointerDown&&!t.button&&o&&(this.isPointerDown=!0,this.pointerIdentifier=void 0!==i.pointerId?i.pointerId:i.identifier,this.pointerDown(t,i),this.bindActivePointerEvents(),this.emitEvent("pointerDown",[t,i]))},s.onmousemove=function(t){this.pointerMove(t,t)},s.onpointermove=function(t){this.withPointer("pointerMove",t)},s.ontouchmove=function(t){this.withTouch("pointerMove",t)},s.pointerMove=function(t,i){let e={x:i.pageX-this.pointerDownPointer.pageX,y:i.pageY-this.pointerDownPointer.pageY};this.emitEvent("pointerMove",[t,i,e]),!this.isDragging&&this.hasDragStarted(e)&&this.dragStart(t,i),this.isDragging&&this.dragMove(t,i,e)},s.hasDragStarted=function(t){return Math.abs(t.x)>3||Math.abs(t.y)>3},s.dragStart=function(t,i){this.isDragging=!0,this.isPreventingClicks=!0,this.emitEvent("dragStart",[t,i])},s.dragMove=function(t,i,e){this.emitEvent("dragMove",[t,i,e])},s.onmouseup=function(t){this.pointerUp(t,t)},s.onpointerup=function(t){this.withPointer("pointerUp",t)},s.ontouchend=function(t){this.withTouch("pointerUp",t)},s.pointerUp=function(t,i){this.pointerDone(),this.emitEvent("pointerUp",[t,i]),this.isDragging?this.dragEnd(t,i):this.staticClick(t,i)},s.dragEnd=function(t,i){this.isDragging=!1,setTimeout((()=>delete this.isPreventingClicks)),this.emitEvent("dragEnd",[t,i])},s.pointerDone=function(){this.isPointerDown=!1,delete this.pointerIdentifier,this.unbindActivePointerEvents(),this.emitEvent("pointerDone")},s.onpointercancel=function(t){this.withPointer("pointerCancel",t)},s.ontouchcancel=function(t){this.withTouch("pointerCancel",t)},s.pointerCancel=function(t,i){this.pointerDone(),this.emitEvent("pointerCancel",[t,i])},s.onclick=function(t){this.isPreventingClicks&&t.preventDefault()},s.staticClick=function(t,i){let e="mouseup"==t.type;e&&this.isIgnoringMouseUp||(this.emitEvent("staticClick",[t,i]),e&&(this.isIgnoringMouseUp=!0,setTimeout((()=>{delete this.isIgnoringMouseUp}),400)))},e})),
/*!
 * Draggabilly v3.0.0
 * Make that shiz draggable
 * https://draggabilly.desandro.com
 * MIT license
 */
// eslint-disable-next-line
function(t,i){"object"==typeof module&&module.exports?module.exports=i(t,require("get-size"),require("unidragger")):t.Draggabilly=i(t,t.getSize,t.Unidragger)}("undefined"!=typeof window?window:this,(function(t,i,e){let n=t.jQuery;function o(t,i){this.element="string"==typeof t?document.querySelector(t):t,n&&(this.$element=n(this.element)),this.options={},this.option(i),this._create()}let s=o.prototype=Object.create(e.prototype);s.option=function(t){this.options={...this.options,...t}};const r=["relative","absolute","fixed"];s._create=function(){this.position={},this._getPosition(),this.startPoint={x:0,y:0},this.dragPoint={x:0,y:0},this.startPosition={...this.position};let t=getComputedStyle(this.element);r.includes(t.position)||(this.element.style.position="relative"),this.on("pointerDown",this.handlePointerDown),this.on("pointerUp",this.handlePointerUp),this.on("dragStart",this.handleDragStart),this.on("dragMove",this.handleDragMove),this.on("dragEnd",this.handleDragEnd),this.setHandles(),this.enable()},s.setHandles=function(){let{handle:t}=this.options;"string"==typeof t?this.handles=this.element.querySelectorAll(t):"object"==typeof t&&t.length?this.handles=t:t instanceof HTMLElement?this.handles=[t]:this.handles=[this.element]};const h=["dragStart","dragMove","dragEnd"];let a=s.emitEvent;function d(t,i,e){return i?(e=e||"round",Math[e](t/i)*i):t}s.emitEvent=function(i,e){if(!this.isEnabled&&h.includes(i))return;a.call(this,i,e);let n,o=t.jQuery;if(!o||!this.$element)return;let s=e;e&&e[0]instanceof Event&&([n,...s]=e);let r=o.Event(n);r.type=i,this.$element.trigger(r,s)},s._getPosition=function(){let t=getComputedStyle(this.element),i=this._getPositionCoord(t.left,"width"),e=this._getPositionCoord(t.top,"height");this.position.x=isNaN(i)?0:i,this.position.y=isNaN(e)?0:e,this._addTransformPosition(t)},s._getPositionCoord=function(t,e){if(t.includes("%")){let n=i(this.element.parentNode);return n?parseFloat(t)/100*n[e]:0}return parseInt(t,10)},s._addTransformPosition=function(t){let i=t.transform;if(!i.startsWith("matrix"))return;let e=i.split(","),n=i.startsWith("matrix3d")?12:4,o=parseInt(e[n],10),s=parseInt(e[n+1],10);this.position.x+=o,this.position.y+=s},s.handlePointerDown=function(t,i){this.isEnabled&&(this.pointerDownPointer={pageX:i.pageX,pageY:i.pageY},t.preventDefault(),document.activeElement.blur(),this.bindActivePointerEvents(t),this.element.classList.add("is-pointer-down"))},s.handleDragStart=function(){this.isEnabled&&(this._getPosition(),this.measureContainment(),this.startPosition.x=this.position.x,this.startPosition.y=this.position.y,this.setLeftTop(),this.dragPoint.x=0,this.dragPoint.y=0,this.element.classList.add("is-dragging"),this.animate())},s.measureContainment=function(){let t=this.getContainer();if(!t)return;let e=i(this.element),n=i(t),{borderLeftWidth:o,borderRightWidth:s,borderTopWidth:r,borderBottomWidth:h}=n,a=this.element.getBoundingClientRect(),d=t.getBoundingClientRect(),u=o+s,l=r+h,c=this.relativeStartPosition={x:a.left-(d.left+o),y:a.top-(d.top+r)};this.containSize={width:n.width-u-c.x-e.width,height:n.height-l-c.y-e.height}},s.getContainer=function(){let t=this.options.containment;if(t)return t instanceof HTMLElement?t:"string"==typeof t?document.querySelector(t):this.element.parentNode},s.handleDragMove=function(t,i,e){if(!this.isEnabled)return;let n=e.x,o=e.y,s=this.options.grid,r=s&&s[0],h=s&&s[1];n=d(n,r),o=d(o,h),n=this.containDrag("x",n,r),o=this.containDrag("y",o,h),n="y"==this.options.axis?0:n,o="x"==this.options.axis?0:o,this.position.x=this.startPosition.x+n,this.position.y=this.startPosition.y+o,this.dragPoint.x=n,this.dragPoint.y=o},s.containDrag=function(t,i,e){if(!this.options.containment)return i;let n="x"==t?"width":"height",o=d(-this.relativeStartPosition[t],e,"ceil"),s=this.containSize[n];return s=d(s,e,"floor"),Math.max(o,Math.min(s,i))},s.handlePointerUp=function(){this.element.classList.remove("is-pointer-down")},s.handleDragEnd=function(){this.isEnabled&&(this.element.style.transform="",this.setLeftTop(),this.element.classList.remove("is-dragging"))},s.animate=function(){this.isDragging&&(this.positionDrag(),requestAnimationFrame((()=>this.animate())))},s.setLeftTop=function(){let{x:t,y:i}=this.position;this.element.style.left=`${t}px`,this.element.style.top=`${i}px`},s.positionDrag=function(){let{x:t,y:i}=this.dragPoint;this.element.style.transform=`translate3d(${t}px, ${i}px, 0)`},s.setPosition=function(t,i){this.position.x=t,this.position.y=i,this.setLeftTop()},s.enable=function(){this.isEnabled||(this.isEnabled=!0,this.bindHandles())},s.disable=function(){this.isEnabled&&(this.isEnabled=!1,this.isDragging&&this.dragEnd(),this.unbindHandles())};const u=["transform","left","top","position"];return s.destroy=function(){this.disable(),u.forEach((t=>{this.element.style[t]=""})),this.unbindHandles(),this.$element&&this.$element.removeData("draggabilly")},s._init=function(){},n&&n.bridget&&n.bridget("draggabilly",o),o}));