/**
 * Main application
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI
  uiManager.initialize();

  // Elements
  const configForm = document.getElementById('configForm');
  const loadIntegrationBtn = document.getElementById('loadIntegrationBtn');
  const startChatBtn = document.getElementById('startChatBtn');
  const startVideoBtn = document.getElementById('startVideoBtn');
  const endVideoBtn = document.getElementById('endVideoBtn');
  const endChatBtn = document.getElementById('endChatBtn');
  // Add button animations
  uiManager.addButtonAnimation(loadIntegrationBtn);
  uiManager.addButtonAnimation(startChatBtn);
  uiManager.addButtonAnimation(startVideoBtn);
  uiManager.addButtonAnimation(endVideoBtn);
  uiManager.addButtonAnimation(endChatBtn);

  // Initialize form validation
  uiManager.initFormValidation(configForm);

  // Load Integration button click handler
  loadIntegrationBtn.addEventListener('click', async () => {
    try {
      // Validate form
      const config = configManager.loadFromForm(configForm);
      configManager.validate();

      // Show loading
      uiManager.showLoading();

      // Load script
      (function (g, s, c, d, q) {
        q = []; g.__VideoEngagerQueue = q; g.__VideoEngagerConfigs = c; g.VideoEngager = new Proxy({}, { get: (_, m) => (...a) => new Promise((r, rj) => q.push({ m, a, r, rj })) });
        d = document.createElement("script"); d.async = 1; d.src = s; d.charset = "utf-8"; document.head.appendChild(d);
      })(window, config.scriptUrl, config);


      /**
      * Register event handlers for VideoEngager events
      */
      window.VideoEngager.on('VideoEngagerCall.started', (data) => {
        console.log('VideoEngager call started', data);
        uiManager.updateVideoStatus('success', 'Video active');
        uiManager.showFirstElement(endVideoBtn, startVideoBtn);
      });

      window.VideoEngager.on('VideoEngagerCall.ended', (data) => {
        console.log('VideoEngager call ended', data);
        uiManager.updateVideoStatus('ready', 'Ready to Start');
        uiManager.showFirstElement(startVideoBtn, endVideoBtn);
      });

      window.VideoEngager.on('VideoEngagerCall.agentJoined', (data) => {
        console.log('Agent joined the call', data);
        uiManager.updateAgentStatus('success', 'Agent joined');
      });

      window.VideoEngager.on('GenesysMessenger.conversationStarted', (data) => {
        console.log('Genesys conversation started', data);
         uiManager.updateChatStatus('success', 'Chat Active');
         uiManager.updateAgentStatus('loading', 'Waiting for Agent');
          uiManager.showFirstElement(endChatBtn, startChatBtn);
      });

      window.VideoEngager.on('GenesysMessenger.conversationEnded', (data) => {
        console.log('Genesys conversation ended', data);
        uiManager.updateChatStatus('ready', 'Ready to Start');
        uiManager.updateAgentStatus('ready', 'Not Connected');
        uiManager.showFirstElement(startChatBtn, endChatBtn);
      });
      // Wait for script to load and integration to be ready
      await VideoEngager.waitForReady();

      // Show control panel
      uiManager.showControlPanel();

      // Start the second part of the interactive guide
      if (window.startVideoEngagerControlsGuide) {
        window.startVideoEngagerControlsGuide();
      }
    } catch (error) {
      console.error('Failed to load integration', error);
      uiManager.showConfigForm();
      uiManager.showError(error.message, true);
    }
  });

  // Start Chat button click handler
  startChatBtn.addEventListener('click', async () => {
    try {
      uiManager.updateChatStatus('loading', 'Starting chat...');
      await window.VideoEngager.startGenesysChat();
      uiManager.updateChatStatus('success', 'Chat started');
      uiManager.showFirstElement(endChatBtn, startChatBtn);
    } catch (error) {
      console.error('Failed to start chat', error);
      uiManager.updateChatStatus('error', 'Failed to start chat');
      uiManager.showError(error.message);
    }
  });

  // Start Video button click handler
  startVideoBtn.addEventListener('click', async () => {
    try {
      uiManager.updateVideoStatus('loading', 'Starting video...');
      await window.VideoEngager.startVideoChatSession();
      uiManager.updateVideoStatus('success', 'Video started');
      uiManager.showFirstElement(endVideoBtn, startVideoBtn);
    } catch (error) {
      console.error('Failed to start video', error);
      uiManager.updateVideoStatus('error', 'Failed to start video');
      uiManager.showError(error.message);
    }
  });

  // End Video button click handler
  endVideoBtn.addEventListener('click', async () => {
    try {
      uiManager.updateVideoStatus('loading', 'Ending video...');
      await window.VideoEngager.endVideoChatSession();
      uiManager.updateVideoStatus('success', 'Video ended');
      uiManager.showFirstElement(startVideoBtn, endVideoBtn);
    } catch (error) {
      console.error('Failed to end video', error);
      uiManager.updateVideoStatus('error', 'Failed to end video');
      uiManager.showError(error.message);
    }
  });
  // End Chat button click handler
  endChatBtn.addEventListener('click', async () => {
    try {
      uiManager.updateChatStatus('loading', 'Ending chat...');
      await window.VideoEngager.endGenesysChat();
      uiManager.updateChatStatus('success', 'Chat ended');
      uiManager.showFirstElement(startChatBtn, endChatBtn);
    } catch (error) {
      console.error('Failed to end chat', error);
      uiManager.updateChatStatus('error', 'Failed to end chat');
      uiManager.showError(error.message);
    }
  });
});