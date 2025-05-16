/**
 * UI manager for VideoEngager integration
 */
class UIManager {
  constructor() {
    // Sections
    this.configSection = document.getElementById('configSection');
    this.controlSection = document.getElementById('controlSection');
    this.loadingSection = document.getElementById('loadingSection');
    
    // Status indicators
    this.chatStatus = document.getElementById('chatStatus');
    this.videoStatus = document.getElementById('videoStatus');
    this.agentStatus = document.getElementById('agentStatus');
    
    // Event handlers
    this.eventHandlers = {};
  }

  /**
   * Initialize UI
   */
  initialize() {
    // Set form values from config
    this.setFormFromConfig();
    // Show config section by default
    this.showSection(this.configSection);
    
    // Initialize status indicators
    this.updateChatStatus('ready', 'Not Started');
    this.updateVideoStatus('ready', 'Not Started');
    this.updateAgentStatus('ready', 'Not Connected');
    // if Query param showAllButtons is set to 'true', then all buttons under id="controlSection" should be shown
    const urlParams = new URLSearchParams(window.location.search);
    const showAllButtons = urlParams.get('showAllButtons') === 'true';
    const controlButtons = document.querySelectorAll('#controlSection button');
    controlButtons.forEach(button => {
        if (showAllButtons) {
            button.classList.add('forced-show');
        }
    });
  }
  /**
   * Set form values from configuration provided by configManager
   */
  setFormFromConfig() {
    // append current configs to the form inputs
    const form = document.getElementById('configForm');
    form.tenantId.value = configManager.config.videoEngager.tenantId;
    form.veEnv.value = configManager.config.videoEngager.veEnv;
    form.veHttps.checked = configManager.config.videoEngager.veHttps;
    form.deploymentId.value = configManager.config.genesys.deploymentId;
    form.environment.value = configManager.config.genesys.environment || '';
    form.domain.value = configManager.config.genesys.domain || '';
    form.useGenesysMessengerChat.checked = configManager.config.useGenesysMessengerChat;
    form.scriptUrl.value = configManager.config.scriptUrl;
  }
  /**
   * Show a section and hide others
   * @param {HTMLElement} section - The section to show
   */
  showSection(section) {
    // Hide all sections
    [this.configSection, this.controlSection, this.loadingSection].forEach(s => {
      if (s === section) {
        s.classList.remove('hidden');
        setTimeout(() => {
          s.classList.add('active');
        }, 10);
      } else {
        s.classList.remove('active');
        setTimeout(() => {
          s.classList.add('hidden');
        }, 300);
      }
    });
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.showSection(this.loadingSection);
  }

  /**
   * Show config form
   */
  showConfigForm() {
    this.showSection(this.configSection);
  }

  /**
   * Show control panel
   */
  showControlPanel() {
    this.showSection(this.controlSection);
    this.updateChatStatus('ready', 'Ready to Start');
    this.updateVideoStatus('ready', 'Ready to Start');
    this.updateAgentStatus('ready', 'Waiting for Session');
  }

  /**
   * Update chat status
   * @param {string} state - Status state (ready, loading, success, error)
   * @param {string} text - Status text
   */
  updateChatStatus(state, text) {
    this.updateStatusIndicator(this.chatStatus, state, text);
  }

  /**
   * Update video status
   * @param {string} state - Status state (ready, loading, success, error)
   * @param {string} text - Status text
   */
  updateVideoStatus(state, text) {
    this.updateStatusIndicator(this.videoStatus, state, text);
  }

  /**
   * Update agent status
   * @param {string} state - Status state (ready, loading, success, error)
   * @param {string} text - Status text
   */
  updateAgentStatus(state, text) {
    this.updateStatusIndicator(this.agentStatus, state, text);
  }

  /**
   * Update status indicator
   * @param {HTMLElement} indicator - The status indicator element
   * @param {string} state - Status state (ready, loading, success, error)
   * @param {string} text - Status text
   */
  updateStatusIndicator(indicator, state, text) {
    // Remove all state classes
    indicator.classList.remove('status-ready', 'status-loading', 'status-success', 'status-error');
    
    // Add current state class
    indicator.classList.add(`status-${state}`);
    
    // Update status text
    indicator.querySelector('.status-text').textContent = text;
  }

  /**
   * Show error message
   * @param {string} message - Error message
   * @param {boolean} showInForm - Whether to show error in form
   */
  showError(message, showInForm = false) {
    if (showInForm) {
      // Create error message element if it doesn't exist
      let errorEl = document.querySelector('.status-message.error');
      
      if (!errorEl) {
        errorEl = document.createElement('p');
        errorEl.className = 'status-message error';
        const form = document.getElementById('configForm');
        form.insertBefore(errorEl, form.firstChild);
      }
      
      errorEl.textContent = message;
      
      // Scroll to error
      errorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Show error toast or notification
      console.error(message);
    }
  }

  /**
   * Add button animations
   * @param {HTMLElement} button - The button element
   */
  addButtonAnimation(button) {
    button.addEventListener('click', () => {
      button.classList.add('button-press');
      setTimeout(() => {
        button.classList.remove('button-press');
      }, 200);
    });
  }

  /**
   * Show First Element and Hide Others
   * @param {...HTMLElement} element - The element to show
   */
  showFirstElement(...elements) {
    for (let i = 0; i < elements.length; i++) {
      if (i === 0) {
        elements[i].classList.remove('hidden');
      } else {
        elements[i].classList.add('hidden');
      }
    }
  }

  /**
   * Initialize form validation
   * @param {HTMLFormElement} form - The form element
   */
  initFormValidation(form) {
    // Add required validation
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
      field.addEventListener('invalid', (event) => {
        event.preventDefault();
        this.showFieldError(field, `${field.labels[0].textContent} is required`);
      });
      
      field.addEventListener('input', () => {
        this.clearFieldError(field);
      });
    });
  }

  /**
   * Show field error
   * @param {HTMLElement} field - The field element
   * @param {string} message - Error message
   */
  showFieldError(field, message) {
    // Clear any existing error
    this.clearFieldError(field);
    
    // Add error class to field
    field.classList.add('error');
    
    // Create error message element
    const errorEl = document.createElement('span');
    errorEl.className = 'field-error';
    errorEl.textContent = message;
    
    // Insert after field
    field.parentNode.insertBefore(errorEl, field.nextSibling);
    
    // Focus field
    field.focus();
  }

  /**
   * Clear field error
   * @param {HTMLElement} field - The field element
   */
  clearFieldError(field) {
    // Remove error class
    field.classList.remove('error');
    
    // Remove error message
    const errorEl = field.parentNode.querySelector('.field-error');
    if (errorEl) {
      errorEl.parentNode.removeChild(errorEl);
    }
  }
}

// Export singleton instance
const uiManager = new UIManager();