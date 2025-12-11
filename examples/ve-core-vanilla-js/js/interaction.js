// @ts-check

/**
 * Main entry point for the interaction page
 */
async function start() {
    // STEP 1. Import VideoEngagerWidgetCore and GenesysIntegration
    const { GenesysIntegration, VideoEngagerCore } = window.VideoEngager;

    // STEP 2. Get configurations from URL parameters
    const { genesysConfigs, veConfigs, parsedParams } = getConfigs();

    // Validate required configurations
    const validation = validateConfigs(parsedParams);
    if (!validation.isValid) {
        throw new Error(validation.error);
    }

    console.log('Parsed parameters:', parsedParams);

    // STEP 3. Get request data (service and beneficiary info)
    const requestData = getRequestData();
    if (!requestData) {
        throw new Error('Request data not found. Please restart the process.');
    }

    // Display service badge
    const serviceBadge = document.getElementById('serviceBadge');
    if (serviceBadge) {
        serviceBadge.textContent = requestData.service.name;
    }

    console.log('Request data:', requestData);

    // STEP 4. Initialize VideoEngagerWidgetCore with GenesysIntegration
    /** @type {VideoEngagerCore} */
    const videoEngagerInstance = new VideoEngager.VideoEngagerCore({...veConfigs, logger: true });
    /** @type {GenesysIntegration} */
    const genesysIntegration = new VideoEngager.GenesysIntegration({...genesysConfigs, logger: true});

    // Set up VideoEngager UI callbacks
    setVideoEngagerUICallbacks(videoEngagerInstance);

    // STEP 5. Wait for Genesys to be fully ready before proceeding
    console.log('Checking Genesys ready state...', {
        hasWrapper: !!genesysIntegration.genesysJsSdkWrapper,
        isReady: genesysIntegration.genesysJsSdkWrapper && genesysIntegration.genesysJsSdkWrapper.isReady
    });

    // STEP 6. Set contact center integration
    await videoEngagerInstance.setContactCenterIntegration(genesysIntegration);

    // STEP 7. Initially hide Genesys UI (will show after session starts)
    genesysIntegration.genesysJsSdkWrapper.hideGenesysUI(true);

    if (videoEngagerInstance.contactCenterInActiveInteraction) {
        await videoEngagerInstance.endContactCenterInteraction();
    }

    // STEP 8. Prepare custom attributes for Genesys
    const customAttributes = formatCustomAttributes(requestData);
    // Set up event listeners
    setListeners(videoEngagerInstance);
    console.log('Custom attributes:', customAttributes);

    // STEP 9. Start VideoEngager interaction with chat
    await videoEngagerInstance.startVideoEngagerInteraction({
        bindToOrStartContactCenterInteraction: true,
        callConfigs: {
            // You can pass specific interaction ID if you have one
            // Otherwise, a new interaction will be created
        },
        customAttributes: customAttributes
    });
    videoEngagerInstance.contactCenterIntegrationInstance.genesysJsSdkWrapper.hideGenesysUI(false);

    // Hide loading screen
    setLoading(false);
}

/**
 * Set up VideoEngager UI callbacks
 * @param {VideoEngagerCore} videoEngagerInstance
 */
function setVideoEngagerUICallbacks(videoEngagerInstance) {
    videoEngagerInstance.setUiCallbacks({
        createIframe: createIframe,
        destroyIframe: () => {
            const backButton = document.querySelector('.back-button');
            if (backButton) {
                backButton.style.display = 'block';
            }
        },
        setIframeVisibility: (visible) => {},
        getIframeInstance: getIframe
    });
}

/**
 * Set up event listeners for VideoEngager events
 * @param {VideoEngagerCore} videoEngagerInstance
 */
function setListeners(videoEngagerInstance) {
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', (e) => {
            e.preventDefault();
            // As we are going back we will remove the existing user data
            clearData('selectedService');
            clearData('beneficiaryData');
            // Navigate back to index.html while preserving URL parameters
            const urlWithParams = buildUrlWithParams('index.html');
            window.location.replace(urlWithParams);
        })
    }
    videoEngagerInstance.on('videoEngager:videoSessionEnd', async () => {
        if (videoEngagerInstance.contactCenterInActiveInteraction) {
            await videoEngagerInstance.endContactCenterInteraction();
        }
    });
    // When Genesys session ends, hide the chat UI
    videoEngagerInstance.on('integration:sessionEnded', () => {
        setTimeout(() => {
            if (videoEngagerInstance.contactCenterIntegrationInstance) {
                videoEngagerInstance.contactCenterIntegrationInstance.genesysJsSdkWrapper.hideGenesysUI(true);
            }
            const chatSection = document.querySelector('#chatSection');
            if (chatSection) {
                chatSection.remove();
            }
        }, 100);
    });

    // Handle errors
    videoEngagerInstance.on('videoEngager:error', (error) => {
        console.error('VideoEngager error:', error);
        showErrorOnUi('Video call error: ' + (error.message || 'Unknown error'));
    });

    videoEngagerInstance.on('integration:error', (error) => {
        console.error('Integration error:', error);
        showErrorOnUi('Integration error: ' + (error.message || 'Unknown error'));
    });
}

// Initialize loading state and start
setLoading(true);
showVideoUI(false);

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await start()
    } catch (err) {
        console.error('Error in main start function:', err);
        showErrorOnUi(err.message || 'An unexpected error occurred while starting the session.');
    }
});
