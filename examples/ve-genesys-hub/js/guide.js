document.addEventListener('DOMContentLoaded', () => {
  const guideManager = {
    init() {
      // Ensure this runs after the main app's DOMContentLoaded
      // or that elements are guaranteed to be present.
      // Small delay to ensure all elements are rendered if necessary
      setTimeout(() => {
        this.startInitialTour();
      }, 500); 
    },

    startInitialTour() {
      const intro = introJs();
      intro.setOptions({
        steps: [
          {
            element: document.querySelector('#configForm .form-group:nth-child(1)'), // VideoEngager Settings
            title: 'VideoEngager Configuration',
            intro: 'First, let\'s configure your VideoEngager settings. You can find your specific settings at <a href=\"YOUR_VIDEOENGAGER_SETTINGS_URL\" target=\"_blank\">YOUR_VIDEOENGAGER_SETTINGS_URL</a>.',
            position: 'right'
          },
          {
            element: document.getElementById('tenantId'),
            title: 'Tenant ID',
            intro: '<strong>Tenant ID (Required):</strong> Your unique identifier for the VideoEngager service. Example: <code>YOUR_TENANT_ID</code>.',
            position: 'bottom'
          },
          {
            element: document.getElementById('veEnv'),
            title: 'VideoEngager Environment',
            intro: '<strong>Environment (Required):</strong> The VideoEngager service domain your account is on. Example: <code>staging.leadsecure.com</code> or <code>videome.leadsecure.com</code>.',
            position: 'bottom'
          },
          {
            element: document.querySelector('#veHttps').closest('.form-field'),
            title: 'Use HTTPS',
            intro: '<strong>Use HTTPS (Recommended):</strong> Specifies whether to use HTTPS for the VideoEngager service. Defaults to true.',
            position: 'bottom'
          },
          {
            element: document.querySelector('#isPopup').closest('.form-field'),
            title: 'Use Popup',
            intro: '<strong>Use Popup:</strong> Determines if the VideoEngager widget should operate in a popup window or embedded. Defaults to false (embedded). For this demo, it is checked.',
            position: 'bottom'
          },
          {
            element: document.querySelector('#configForm .form-group:nth-child(2)'), // Genesys Settings
            title: 'Genesys Cloud Configuration',
            intro: 'Next, configure the Genesys Cloud settings. You can generate a new deployment ID at <a href=\"YOUR_GENESYS_DEPLOYMENT_URL\" target=\"_blank\">YOUR_GENESYS_DEPLOYMENT_URL</a>.',
            position: 'right'
          },
          {
            element: document.getElementById('deploymentId'),
            title: 'Deployment ID',
            intro: '<strong>Deployment ID (Required):</strong> Your Genesys Cloud Widget Deployment ID.',
            position: 'bottom'
          },
          {
            element: document.getElementById('environment'),
            title: 'Genesys Environment',
            intro: '<strong>Environment OR Domain (Required):</strong> The Genesys Cloud environment region (e.g., <code>us-east-1</code>, <code>eu-west-1</code>). Provide this OR a Domain.',
            position: 'bottom'
          },
          {
            element: document.getElementById('domain'),
            title: 'Genesys Domain',
            intro: '<strong>Domain OR Environment (Required):</strong> Your Genesys Cloud domain (e.g., <code>mypurecloud.com</code>, <code>mypurecloud.ie</code>). Provide this OR an Environment.',
            position: 'bottom'
          },
          {
            intro: '<strong>Critical Genesys Settings:</strong> Ensure your Genesys Cloud integration has the necessary <strong>permissions</strong> (e.g., for messaging, user details) and that <strong>integration settings</strong> (like authorized URLs) are correctly configured in Genesys Cloud. These affect widget functionality.'
          },
          {
            element: document.querySelector('#configForm .form-group:nth-child(4)'), // Script URL
            title: 'Script Implementation',
            intro: 'This is the URL for the VideoEngager Genesys Hub script.',
            position: 'top'
          },
          {
            element: document.getElementById('scriptUrl'),
            title: 'Widget Script URL',
            intro: 'The URL points to the <code>genesys-hub.umd.js</code> file. This script handles the communication between your application, VideoEngager, and Genesys Cloud. It\'s loaded asynchronously.',
            position: 'bottom'
          },
          {
            intro: '<strong>Script Placement:</strong> In a real application, this script (or a similar loader) would be included in your HTML, typically in the <code>&lt;head&gt;</code> or before the closing <code>&lt;/body&gt;</code> tag, as shown in the README.md.'
          },
          {
            element: document.getElementById('loadIntegrationBtn'),
            title: 'Load Integration',
            intro: 'Once all configurations are set, click this button to load the VideoEngager widget and initialize the integration with Genesys Cloud.',
            position: 'top'
          },
          {
            element: document.getElementById('loadIntegrationBtn'),
            title: 'Code Execution (Behind the Scenes)',
            intro: 'When clicked, the button triggers JavaScript (in <code>app.js</code>) that: <br/>1. Reads the configuration values. <br/>2. Dynamically loads the script from the specified URL. <br/>3. Initializes <code>VideoEngager</code> and waits for it to be ready. <br/>4. Shows the control panel.',
            position: 'top'
          }
        ],
        showBullets: true,
        showProgress: true,
        exitOnOverlayClick: false, // Keep it open
        tooltipClass: 'customTooltip' // You can add custom CSS classes
      });
      intro.start();
    },

    startControlsTour() {
      // This function will be called after the integration is loaded
      const intro = introJs();
      // Define tour options in a variable accessible by closures
      const tourOptions = {
        steps: [
          {
            element: document.getElementById('controlSection'),
            title: 'Interactive Features',
            intro: 'The integration is loaded! Now let\'s explore the interactive controls.',
            position: 'right'
          },
          {
            element: document.getElementById('startChatBtn'),
            title: 'Start Chat',
            intro: 'Click this button to initiate a Genesys Cloud chat session. <br/>Corresponds to: <code>VideoEngager.startGenesysChat()</code>',
            position: 'bottom'
          },
          {
            element: document.getElementById('endChatBtn'),
            title: 'End Chat',
            intro: 'This button (visible after a chat starts) ends the current Genesys Cloud chat session. <br/>Corresponds to: <code>VideoEngager.endGenesysChat()</code>',
            position: 'bottom',
            stepId: 'endChatStep'
          },
          {
            element: document.getElementById('startVideoBtn'),
            title: 'Start Video',
            intro: 'Click this button to start a VideoEngager video session. <br/>Corresponds to: <code>VideoEngager.startVideoChatSession()</code>',
            position: 'bottom'
          },
          {
            element: document.getElementById('endVideoBtn'),
            title: 'End Video',
            intro: 'This button (visible after a video session starts) ends the current VideoEngager video session. <br/>Corresponds to: <code>VideoEngager.endVideoChatSession()</code>',
            position: 'bottom',
            stepId: 'endVideoStep'
          },
          {
            element: document.querySelector('.status-container'),
            title: 'Status Management',
            intro: 'These indicators show the current status of Chat, Video, and Agent connections.',
            position: 'top'
          },
          {
            title: 'Listening to Events',
            intro: `You can listen to various events to manage state in your application. Example:
            <pre><code class=\"language-javascript\">VideoEngager.on('VideoEngagerCall.started', (data) => {\n  console.log('Video Call Started!', data);\n  // Update your UI\n});\n\nVideoEngager.on('GenesysMessenger.conversationStarted', (data) => {\n  console.log('Genesys Chat Started!', data);\n  // Update your UI\n});</code></pre>
            Available events include:
            <ul>
              <li><code>GenesysMessenger.opened</code></li>
              <li><code>GenesysMessenger.closed</code></li>
              <li><code>GenesysMessenger.conversationStarted</code></li>
              <li><code>GenesysMessenger.conversationEnded</code></li>
              <li><code>VideoEngagerCall.started</code></li>
              <li><code>VideoEngagerCall.ended</code></li>
              <li><code>VideoEngagerCall.agentJoined</code></li>
            </ul>
            Use <code>VideoEngager.off('eventName', callback)</code> to unsubscribe.`,
            position: 'top'
          },
          {
            title: 'Guide Complete!',
            intro: 'You have completed the interactive guide for VideoEngager & Genesys Cloud integration. Explore the demo and refer to the README for more details.',
            position: 'center'
          }
        ],
        showBullets: true,
        showProgress: true,
        exitOnOverlayClick: true,
        tooltipClass: 'customTooltip'
      };
      intro.setOptions(tourOptions);

      intro.onbeforechange(function(targetElement) {
        const self = this; // Current intro instance

        let prospectiveStepObj = null;
        if (self._introItems) {
            for (let i = 0; i < self._introItems.length; i++) {
                if (self._introItems[i].element === targetElement) {
                    prospectiveStepObj = self._introItems[i];
                    break;
                }
            }
        }

        if (!prospectiveStepObj || !prospectiveStepObj.stepId) {
          return true; // Not a step we need to specially handle, or no stepId defined for it.
        }

        const stepId = prospectiveStepObj.stepId;
        const buttonElement = targetElement;

        if (stepId === 'endChatStep' || stepId === 'endVideoStep') {
          if (buttonElement && buttonElement.classList.contains('hidden')) {
            console.warn(`Intro.js: Step '${stepId}' targets a hidden button. Exiting tour and waiting.`);
            
            const stepIndexToResumeAt = self._introItems.indexOf(prospectiveStepObj); // 0-based index

            self.exit(); // Exit the current tour completely

            const observer = new MutationObserver((mutationsList, obs) => {
              if (!buttonElement.classList.contains('hidden')) {
                obs.disconnect(); // Stop observing
                console.log(`Intro.js: Button for step '${stepId}' is now visible. Restarting tour at this step.`);
                
                const newIntro = introJs();
                newIntro.setOptions(tourOptions); // Use the original tourOptions from the outer scope
                // currentStep option is 0-indexed and sets the step to start with.
                newIntro.setOption('currentStep', stepIndexToResumeAt).start();
              }
            });
            observer.observe(buttonElement, {
              attributes: true,
              attributeFilter: ['class']
            });
            return false; // Prevent intro.js from transitioning to this step for now.
          }
        }
        return true; // Allow transition for other steps or if the button is already visible.
      });

      // Ensure the control section is visible before starting this tour
      if (document.getElementById('controlSection').classList.contains('active')) {
        intro.start();
      } else {
        // Fallback or error if the section isn't ready
        console.warn('Control section not active. Cannot start controls tour.');
        // wait for the control section to be active
        const observer = new MutationObserver(() => {
          if (document.getElementById('controlSection').classList.contains('active')) {
            intro.start();
            observer.disconnect(); // Stop observing once the section is active
          }
        });
        observer.observe(document.getElementById('controlSection'), {
          attributes: true,
          childList: true,
          subtree: true
        });
      }
    }
  };

  // Expose the controls tour starter to be called from app.js
//   window.startVideoEngagerControlsGuide = guideManager.startControlsTour;

  // Initialize the first part of the guide
//   guideManager.init();
});
