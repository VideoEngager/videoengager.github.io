// @ts-check

/**
 * Parse URL parameters and build configuration objects
 * @returns {Object} Configuration object with genesysConfigs, veConfigs, and parsedParams
 */
function getConfigs() {
    const urlParams = new URLSearchParams(window.location.search);

    // Parse URL parameters
    const parsedParams = {
        // Genesys parameters
        genesysDomain: urlParams.get('genesysDomain') || 'mypurecloud.com',
        genesysDeploymentId: urlParams.get('genesysDeploymentId') || '',

        // VideoEngager parameters
        veDomain: urlParams.get('veDomain') || 'videome.leadsecure.com',
        veTenantId: urlParams.get('veTenantId') || '',
    };

    // Build Genesys configuration
    const genesysConfigs = {
        domain: parsedParams.genesysDomain,
        deploymentId: parsedParams.genesysDeploymentId,
    };

    // Build VideoEngager configuration
    const veConfigs = {
        tenantId: parsedParams.veTenantId,
        veEnv: parsedParams.veDomain,
    };

    console.log(genesysConfigs, veConfigs, parsedParams)

    return {
        genesysConfigs,
        veConfigs,
        parsedParams
    };
}

/**
 * Validate required configuration parameters
 * @param {Object} parsedParams - Parsed URL parameters
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validateConfigs(parsedParams) {
    const requiredParams = [
        { key: 'genesysDeploymentId', name: 'Genesys Deployment ID' },
        { key: 'veTenantId', name: 'VideoEngager Tenant ID' }
    ];

    const missingParams = requiredParams.filter(param => !parsedParams[param.key]);

    if (missingParams.length > 0) {
        const missingNames = missingParams.map(p => p.name).join(', ');
        return {
            isValid: false,
            error: `Missing required parameters: ${missingNames}`
        };
    }

    return { isValid: true };
}
