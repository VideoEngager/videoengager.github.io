/**
 * Environment Configuration Module
 * 
 * This module validates and manages environment variables,
 * ensuring all required configuration is present and valid
 * before the application starts.
 */

/**
 * Validate all required environment variables
 * 
 * Throws an error if any required variables are missing or invalid
 */
function validateEnvironment() {
    console.log('🔍 Validating environment configuration...');
    
    // ============================================
    // REQUIRED ENVIRONMENT VARIABLES
    // ============================================
    
    const requiredEnvVars = [
        // VideoEngager Configuration
        {
            name: 'VE_PAK',
            description: 'VideoEngager Partner Access Key',
            required: true,
            sensitive: true
        },
        {
            name: 'VE_EXTERNAL_ID',
            description: 'VideoEngager External ID',
            required: true,
            sensitive: false
        },
        {
            name: 'VE_EMAIL',
            description: 'VideoEngager Authorized Email',
            required: true,
            sensitive: false,
        },
        {
            name: 'VE_DOMAIN',
            description: 'VideoEngager Domain',
            required: false,
            default: 'dev.videoengager.com',
            validator: isValidDomain
        },
        
        // Genesys Configuration
        {
            name: 'GENESYS_ENVIRONMENT',
            description: 'Genesys Cloud Environment',
            required: true,
            sensitive: false,
            validator: isValidDomain
        },
        {
            name: 'GENESYS_CLIENT_ID',
            description: 'Genesys OAuth Client ID',
            required: true,
            sensitive: true
        },
        {
            name: 'GENESYS_CLIENT_SECRET',
            description: 'Genesys OAuth Client Secret',
            required: true,
            sensitive: true
        },
        {
            name: 'GENESYS_QUEUE_ID',
            description: 'Genesys Queue ID',
            required: true,
            sensitive: false
        },
        {
            name: 'GENESYS_SCRIPT_ID',
            description: 'Genesys Script ID',
            required: true,
            sensitive: false
        },
        
        // Application Configuration
        {
            name: 'PORT',
            description: 'Server Port',
            required: false,
            default: '3001',
            validator: isValidPort
        },
        {
            name: 'NODE_ENV',
            description: 'Node Environment',
            required: false,
            default: 'development',
            validator: (value) => ['development', 'production', 'test'].includes(value)
        },
        {
            name: 'LOG_LEVEL',
            description: 'Logging Level',
            required: false,
            default: 'info',
            validator: (value) => ['error', 'warn', 'info', 'debug'].includes(value)
        },
        
        // Security Configuration
        {
            name: 'FRONTEND_URL',
            description: 'Frontend URL for CORS',
            required: false,
            default: 'http://localhost:3001',
            validator: isValidUrl
        }
    ];
    
    // ============================================
    // VALIDATION PROCESS
    // ============================================
    
    const errors = [];
    const warnings = [];
    const config = {};
    
    for (const envVar of requiredEnvVars) {
        const value = process.env[envVar.name];
        
        // Check if required variable is missing
        if (envVar.required && !value) {
            errors.push(`❌ Missing required environment variable: ${envVar.name}`);
            errors.push(`   Description: ${envVar.description}`);
            continue;
        }
        
        // Use default value if not provided
        const finalValue = value || envVar.default;
        
        // Validate the value if validator is provided
        if (finalValue && envVar.validator) {
            if (!envVar.validator(finalValue)) {
                errors.push(`❌ Invalid value for ${envVar.name}: ${envVar.sensitive ? '[REDACTED]' : finalValue}`);
                errors.push(`   Description: ${envVar.description}`);
                continue;
            }
        }
        
        // Store configuration
        config[envVar.name] = finalValue;
        
        // Log configuration (mask sensitive values)
        const displayValue = envVar.sensitive ? '[REDACTED]' : finalValue;
        console.log(`✅ ${envVar.name}: ${displayValue}`);
        
        // Check for warnings
        if (envVar.name === 'NODE_ENV' && finalValue !== 'production') {
            warnings.push(`⚠️  Running in ${finalValue} mode`);
        }
        
        if (envVar.name === 'VE_DOMAIN' && finalValue.includes('dev.')) {
            warnings.push(`⚠️  Using development VideoEngager domain`);
        }
    }
    
    // ============================================
    // ADDITIONAL VALIDATIONS
    // ============================================
    
    // Check for conflicting configurations
    if (config.NODE_ENV === 'production' && config.VE_DOMAIN?.includes('dev.')) {
        warnings.push(`⚠️  Production mode but using development VideoEngager domain`);
    }
    
    // Check for missing optional but recommended variables
    const recommendedVars = [
        'DATABASE_URL',
        'REDIS_URL',
        'WEBHOOK_SECRET',
        'API_KEY'
    ];
    
    for (const varName of recommendedVars) {
        if (!process.env[varName]) {
            warnings.push(`⚠️  Recommended environment variable not set: ${varName}`);
        }
    }
    
    // ============================================
    // DISPLAY RESULTS
    // ============================================
    
    console.log('\n📊 Environment Validation Results:');
    console.log(`✅ Valid configurations: ${requiredEnvVars.length - errors.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    
    // Display warnings
    if (warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        warnings.forEach(warning => console.log(warning));
    }
    
    // Display errors and exit if any
    if (errors.length > 0) {
        console.log('\n❌ Errors:');
        errors.forEach(error => console.log(error));
        console.log('\n💡 Please check your .env file and ensure all required variables are set.');
        console.log('📖 Refer to the README.md for configuration instructions.');
        process.exit(1);
    }
    
    console.log('\n✅ Environment validation passed!');
    
    // Store validated configuration
    global.appConfig = config;
    
    return config;
}

/**
 * Get application configuration
 * 
 * @returns {Object} Application configuration
 */
function getConfig() {
    return global.appConfig || {};
}

/**
 * Check if application is running in production
 * 
 * @returns {boolean} True if production
 */
function isProduction() {
    return process.env.NODE_ENV === 'production';
}

/**
 * Check if application is running in development
 * 
 * @returns {boolean} True if development
 */
function isDevelopment() {
    return process.env.NODE_ENV === 'development';
}

/**
 * Get database configuration
 * 
 * @returns {Object} Database configuration
 */
function getDatabaseConfig() {
    return {
        url: process.env.DATABASE_URL,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'callback_db',
        username: process.env.DB_USER || 'callback_user',
        password: process.env.DB_PASSWORD,
        ssl: isProduction(),
        pool: {
            min: parseInt(process.env.DB_POOL_MIN || '2'),
            max: parseInt(process.env.DB_POOL_MAX || '10')
        }
    };
}

/**
 * Get Redis configuration
 * 
 * @returns {Object} Redis configuration
 */
function getRedisConfig() {
    return {
        url: process.env.REDIS_URL,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0')
    };
}

/**
 * Get logging configuration
 * 
 * @returns {Object} Logging configuration
 */
function getLoggingConfig() {
    return {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
        file: process.env.LOG_FILE || 'logs/app.log',
        maxSize: process.env.LOG_MAX_SIZE || '10m',
        maxFiles: process.env.LOG_MAX_FILES || '5',
        console: process.env.LOG_CONSOLE !== 'false'
    };
}

/**
 * Get security configuration
 * 
 * @returns {Object} Security configuration
 */
function getSecurityConfig() {
    return {
        corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001'],
        apiKey: process.env.API_KEY,
        webhookSecret: process.env.WEBHOOK_SECRET,
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
        sessionSecret: process.env.SESSION_SECRET || 'default-secret-change-in-production',
        jwtSecret: process.env.JWT_SECRET,
        encryptionKey: process.env.ENCRYPTION_KEY
    };
}

// ============================================
// VALIDATION HELPER FUNCTIONS
// ============================================

/**
 * Validate email format
 * 
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate domain format
 * 
 * @param {string} domain - Domain to validate
 * @returns {boolean} True if valid
 */
function isValidDomain(domain) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})*$/;
    return domainRegex.test(domain);
}

/**
 * Validate port number
 * 
 * @param {string} port - Port to validate
 * @returns {boolean} True if valid
 */
function isValidPort(port) {
    const portNum = parseInt(port);
    return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
}

/**
 * Validate URL format
 * 
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Generate example .env file content
 * 
 * @returns {string} Example .env content
 */
function generateExampleEnv() {
    return `# VideoEngager Configuration
VE_PAK=your-partner-access-key
VE_EXTERNAL_ID=your-external-id
VE_EMAIL=your-email@company.com
VE_DOMAIN=your-domain.videoengager.com

# Genesys Cloud Configuration
GENESYS_ENVIRONMENT=mypurecloud.com
GENESYS_CLIENT_ID=your-client-id
GENESYS_CLIENT_SECRET=your-client-secret
GENESYS_QUEUE_ID=your-queue-id
GENESYS_SCRIPT_ID=your-script-id

# Application Configuration
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

# Security Configuration
FRONTEND_URL=http://localhost:3001
API_KEY=your-api-key
WEBHOOK_SECRET=your-webhook-secret

# Database Configuration (Optional)
DATABASE_URL=postgresql://user:password@localhost:5432/callback_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=callback_db
DB_USER=callback_user
DB_PASSWORD=your-db-password

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# Logging Configuration (Optional)
LOG_FORMAT=json
LOG_FILE=logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5
LOG_CONSOLE=true

# Rate Limiting Configuration (Optional)
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
CORS_ORIGINS=http://localhost:3001,https://yourdomain.com

# Session/JWT Configuration (Optional)
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
`;
}

/**
 * Validate configuration compatibility
 * 
 * @returns {Array} Array of compatibility issues
 */
function validateCompatibility() {
    const issues = [];
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
    
    if (majorVersion < 16) {
        issues.push(`Node.js version ${nodeVersion} is not supported. Please use Node.js 16 or higher.`);
    }
    
    // Check required Node.js modules
    const requiredModules = [
        'express',
        'axios',
        'cors',
        'dotenv',
        'helmet',
        'express-rate-limit'
    ];
    
    for (const module of requiredModules) {
        try {
            require.resolve(module);
        } catch (error) {
            issues.push(`Required module '${module}' is not installed. Run: npm install ${module}`);
        }
    }
    
    return issues;
}

/**
 * Display configuration summary
 */
function displayConfigSummary() {
    const config = getConfig();
    
    console.log('\n📋 Configuration Summary:');
    console.log('================================');
    console.log(`🌐 Environment: ${config.NODE_ENV}`);
    console.log(`🚀 Port: ${config.PORT}`);
    console.log(`📹 VideoEngager Domain: ${config.VE_DOMAIN}`);
    console.log(`☁️  Genesys Environment: ${config.GENESYS_ENVIRONMENT}`);
    console.log(`📊 Log Level: ${config.LOG_LEVEL}`);
    console.log(`🔒 Frontend URL: ${config.FRONTEND_URL}`);
    console.log('================================\n');
}

/**
 * Initialize configuration and run all validations
 */
function initializeConfig() {
    console.log('🔧 Initializing application configuration...\n');
    
    // Check compatibility
    const compatibilityIssues = validateCompatibility();
    if (compatibilityIssues.length > 0) {
        console.log('❌ Compatibility Issues:');
        compatibilityIssues.forEach(issue => console.log(`   ${issue}`));
        process.exit(1);
    }
    
    // Validate environment
    const config = validateEnvironment();
    
    // Display summary
    displayConfigSummary();
    
    return config;
}

module.exports = {
    validateEnvironment,
    initializeConfig,
    getConfig,
    isProduction,
    isDevelopment,
    getDatabaseConfig,
    getRedisConfig,
    getLoggingConfig,
    getSecurityConfig,
    generateExampleEnv,
    displayConfigSummary,
    validateCompatibility
};