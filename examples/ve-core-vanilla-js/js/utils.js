// @ts-check

/**
 * Delay helper function
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get or create VideoEngager iframe
 * @returns {HTMLIFrameElement|null}
 */
function getIframe() {
    return document.getElementById('videoEngagerIframe');
}

/**
 * Create VideoEngager iframe
 * @param {string} url - URL for the iframe
 * @returns {HTMLIFrameElement}
 */
function createIframe(url) {
    const videoSection = document.getElementById('videoSection');
    if (!videoSection) {
        throw new Error('Video section not found');
    }

    // Remove waiting message if present
    const waitingMessage = document.getElementById('waitingMessage');
    if (waitingMessage) {
        waitingMessage.style.display = 'none';
    }
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.style.display = 'none';
    }

    // Remove existing iframe if present
    const existingIframe = getIframe();
    if (existingIframe && existingIframe.parentNode) {
        existingIframe.parentNode.removeChild(existingIframe);
    }

    // Create new iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'videoEngagerIframe';
    iframe.src = url;
    iframe.allow = 'camera; microphone; display-capture; autoplay';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    videoSection.appendChild(iframe);
    return iframe;
}

/**
 * Show/hide video UI
 * @param {boolean} visible - Whether to show video UI
 */
function showVideoUI(visible) {
    const iframe = getIframe();
    const waitingMessage = document.getElementById('waitingMessage');

    if (iframe) {
        iframe.style.display = visible ? 'block' : 'none';
    }

    if (waitingMessage) {
        waitingMessage.style.display = visible ? 'none' : 'flex';
    }
}

/**
 * Set loading state
 * @param {boolean} loading - Whether to show loading screen
 */
function setLoading(loading) {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = loading ? 'flex' : 'none';
    }
}

/**
 * Show error on UI
 * @param {string} message - Error message to display
 */
function showErrorOnUi(message) {
    setLoading(false);
    const errorScreen = document.getElementById('errorScreen');
    const errorMessage = document.getElementById('errorMessage');

    if (errorScreen && errorMessage) {
        errorMessage.textContent = message;
        errorScreen.style.display = 'flex';
    } else {
        alert(message);
    }
}

/**
 * Store data in sessionStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 */
function storeData(key, value) {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error storing data:', error);
    }
}

/**
 * Retrieve data from sessionStorage
 * @param {string} key - Storage key
 * @returns {any|null} Retrieved value or null
 */
function retrieveData(key) {
    try {
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error retrieving data:', error);
        return null;
    }
}

/**
 * Clear data from sessionStorage
 * @param {string} key - Storage key
 */
function clearData(key) {
    try {
        sessionStorage.removeItem(key);
    } catch (error) {
        console.error('Error clearing data:', error);
    }
}

/**
 * Get all stored request data
 * @returns {Object|null} Request data including service and beneficiary info
 */
function getRequestData() {
    const serviceData = retrieveData('selectedService');
    const beneficiaryData = retrieveData('beneficiaryData');

    if (!serviceData || !beneficiaryData) {
        return null;
    }

    return {
        service: serviceData,
        beneficiary: beneficiaryData
    };
}

/**
 * Format custom attributes for Genesys
 * @param {Object} requestData - Request data
 * @returns {Object} Formatted custom attributes
 */
function formatCustomAttributes(requestData) {
    if (!requestData) return {};

    return {
        "context.procedureId": requestData.service.id,
        "context.procedureName": requestData.service.name,
        "context.firstName": requestData.beneficiary.name,
        "context.email": requestData.beneficiary.email,
        "context.requestTimestamp": new Date().toISOString()
    };
}

/**
 * Build URL with parameters preserved
 * @param {string} baseUrl - Base URL
 * @param {Object} additionalParams - Additional parameters to add
 * @returns {string} Complete URL with parameters
 */
function buildUrlWithParams(baseUrl, additionalParams = {}) {
    const urlParams = new URLSearchParams(window.location.search);

    // Add additional parameters
    Object.keys(additionalParams).forEach(key => {
        urlParams.set(key, additionalParams[key]);
    });

    return `${baseUrl}?${urlParams.toString()}`;
}
