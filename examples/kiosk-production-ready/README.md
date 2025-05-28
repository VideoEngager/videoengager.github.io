# VideoEngager Kiosk Demo - Production Ready

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)

A production-ready, self-service kiosk application for VideoEngager's video calling capabilities. Built with vanilla JavaScript ES modules, featuring comprehensive error handling, multi-environment support, and enterprise-grade security considerations.

---

## Features

- **Zero-dependency** vanilla JavaScript implementation
- **Multi-environment support** (development, staging, production)
- **Comprehensive error handling** with retry mechanisms
- **Internationalization** support (English, German, Arabic)
- **Responsive design** with Bootstrap integration
- **Security-focused** with input sanitization and XSS protection
- **Timeout management** for calls and inactivity
- **Background carousel** with configurable slides
- **Production monitoring** and logging capabilities

---

## Getting Started

### Prerequisites

- A modern web browser with ES module support
- [Node.js](https://nodejs.org/) (optional, for local development server)
- VideoEngager tenant credentials
- Genesys Cloud deployment credentials

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/VideoEngager/videoengager.github.io
   cd videoengager.github.io/examples/kiosk-production-ready
   ```

2. **Configure your environment:**
   Edit `config/conf.js` to set your VideoEngager and Genesys credentials:
   ```javascript
   // For production deployment, set these via window.ENV_CONFIG
   const configs = {
     production: {
       videoEngager: {
         tenantId: window.ENV_CONFIG?.VE_TENANT_ID,
         veEnv: window.ENV_CONFIG?.VE_ENV,
         deploymentId: window.ENV_CONFIG?.VE_DEPLOYMENT_ID,
       },
       genesys: {
         deploymentId: window.ENV_CONFIG?.GENESYS_DEPLOYMENT_ID,
         domain: window.ENV_CONFIG?.GENESYS_DOMAIN,
       }
     }
   };
   ```

3. **Run the application:**
   ```bash
   # Using Node.js (recommended for development)
   npm start
   
   # Or use any static file server
   npx http-server . -o
   python -m http.server 8000
   ```

4. **Access the kiosk:**
   Open your browser to `http://localhost:8000` (or your server's URL)

---

## Configuration

### Environment Detection

The application automatically detects the environment based on:
- URL parameters: `?env=development|staging|production`
- Hostname patterns:
  - `localhost`, `127.0.0.1` → development
  - `staging`, `dev`, `test` → staging
  - Everything else → production

### Configuration Structure

```javascript
// config/conf.js
const configs = {
  development: {
    videoEngager: {
      tenantId: "test_tenant",
      veEnv: "dev.videoengager.com",
      veHttps: true,
      isPopup: false,
    },
    genesys: {
      deploymentId: "your-deployment-id",
      domain: "mypurecloud.com.au",
      hideGenesysLauncher: false,
    },
    useGenesysMessengerChat: false,
    monitoring: {
      enabled: true,
      level: "debug", // debug, info, error
    },
  },
  // staging and production configurations...
};
```

### Environment Variables (Production)

For production deployments, set configuration via `window.ENV_CONFIG`:

```html
<script>
  window.ENV_CONFIG = {
    VE_TENANT_ID: 'your-tenant-id',
    VE_ENV: 'your-ve-environment.com',
    VE_DEPLOYMENT_ID: 'your-ve-deployment-id',
    GENESYS_DEPLOYMENT_ID: 'your-genesys-deployment-id',
    GENESYS_DOMAIN: 'your-genesys-domain.com'
  };
</script>
```

### Customization Options

#### Language Support
Add or modify languages in `js/kiosk.js`:

```javascript
this.languages = {
  en: {
    motto: "SmartVideo Kiosk Demo",
    connect: "Touch Here To Begin",
    loadingText: "Connecting to an Agent",
    cancelText: "Cancel",
  },
  // Add more languages...
};
```

Access with URL parameter: `?lang=en|de|ar`

#### Visual Customization
Update `config/conf.js` metadata:

```javascript
const metadata = {
  carouselItems: [
    { src: "img/slide-1.avif" },
    { src: "https://example.com/image.jpg" },
  ],
  backgroundImage: "img/background.webp",
};
```

#### Timeout Configuration
Modify timeouts in `js/kiosk.js`:

```javascript
this.timeouts = {
  call: 1000 * 60 * 3,      // 3 minutes call timeout
  inactivity: 1000 * 60 * 60, // 1 hour inactivity timeout
  retry: 1000 * 5,          // 5 seconds retry delay
};
```

---

## How to Use

### Basic Operation

1. **Initial Screen**: The kiosk displays a start button with your configured language and background
2. **Start Call**: Touch/click the start button to initiate a video call
3. **Loading State**: Shows connecting animation and carousel while waiting for agent
4. **Video Call**: Full-screen video interface once agent joins
5. **Auto Return**: Returns to initial screen when call ends or times out

### User Interactions

- **Start Video Call**: Large circular button on initial screen
- **Cancel Call**: X button during loading/connecting phase  
- **Automatic Timeout**: Returns to start after inactivity or failed connections
- **Error Handling**: User-friendly error messages with retry options

---

## Architecture Overview

### Core Classes

#### `KioskApplication` ([js/kiosk.js](js/kiosk.js))
Main application orchestrator handling:
- UI state management and screen transitions
- Event coordination between components
- Language and customization application
- Timer and timeout management

#### `VideoEngagerClient` ([js/client.js](js/client.js))
VideoEngager SDK integration layer:
- Secure configuration proxy setup
- Dynamic script loading with integrity checks
- Promise-based API wrapper
- Event handling and error management

#### `EnvironmentConfig` ([config/environment.js](config/environment.js))
Environment detection and configuration:
- Automatic environment detection
- Configuration validation and sanitization
- Metadata loading for UI customization

#### `ErrorHandler` ([js/error-handler.js](js/error-handler.js))
Comprehensive error management:
- Categorized error types with user-friendly messages
- Retry logic with exponential backoff
- Modal display system
- Logging and monitoring integration

#### `TimeoutManager` ([js/timeout-manager.js](js/timeout-manager.js))
Centralized timeout handling:
- Named timeout management
- Automatic cleanup
- Remaining time calculation

### Security Features

- **Input Sanitization**: All user inputs and dynamic content sanitized
- **XSS Protection**: HTML and text sanitization utilities
- **URL Validation**: Strict validation for external resources
- **CSP Ready**: Compatible with Content Security Policy headers
- **Error Information Disclosure**: Limited error details in production

### Error Handling Strategy

```javascript
// Categorized error types with automatic handling
const ErrorTypes = {
  NETWORK_ERROR: {
    userMessage: "Please check your internet connection and try again.",
    shouldRetry: false,
  },
  CONFIG_INVALID: {
    userMessage: "Service configuration is invalid. Please contact support.",
    shouldRetry: false,
  },
  LIBRARY_LOAD_FAILED: {
    userMessage: "Unable to load required services. Please refresh the page.",
    shouldRetry: true,
    retryDelay: 5000,
  },
  // More error types...
};
```

---

## Deployment

**Note: This is a demo application intended for third-party developers to understand VideoEngager integration patterns. Production deployment is the responsibility of the implementing organization.**

### Third-Party Implementation Responsibilities

As a third-party developer implementing this kiosk demo in production, you are responsible for:

#### Infrastructure & Hosting
- **Web Server Setup**: Deploy on your preferred hosting platform (AWS, Azure, GCP, on-premises)
- **SSL/TLS Configuration**: Implement HTTPS with valid certificates
- **Load Balancing**: Configure for high availability if needed
- **CDN Integration**: Set up content delivery networks for optimal performance

#### Security Implementation
- **Content Security Policy (CSP)**: Configure appropriate CSP headers
- **Environment Variables**: Securely manage VideoEngager and Genesys credentials
- **Access Control**: Implement authentication/authorization if required
- **Network Security**: Configure firewalls and network access controls

#### Monitoring & Operations
- **Application Monitoring**: Integrate with your monitoring solutions (New Relic, DataDog, etc.)
- **Error Tracking**: Connect to your error reporting systems (Sentry, Bugsnag, etc.)
- **Logging Infrastructure**: Forward application logs to your centralized logging
- **Health Checks**: Implement uptime monitoring and alerting

#### Customization & Branding
- **Visual Customization**: Apply your organization's branding, colors, and styling
- **Language Localization**: Add additional languages as needed for your regions
- **Business Logic**: Implement any custom business rules or integrations
- **Analytics Integration**: Add your preferred analytics tracking

### Development Environment Setup
For local development and testing:

```bash
# Clone the demo repository
git clone https://github.com/VideoEngager/videoengager.github.io
cd videoengager.github.io/examples/kiosk-production-ready

# Use any static file server for local testing
npx http-server . -p 8080
# or
python -m http.server 8080
# or
php -S localhost:8080
```

### Sample Production Deployment Patterns

#### Static Hosting (Recommended for demos)
```bash
# Example: Deploy to AWS S3 + CloudFront
aws s3 sync . s3://your-kiosk-bucket/
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

#### Docker Containerization (Example)
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html

# Add your custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Environment Configuration Template
```html
<!-- Include before loading the kiosk application -->
<script>
  window.ENV_CONFIG = {
    // Your VideoEngager credentials
    VE_TENANT_ID: process.env.VE_TENANT_ID || 'your-tenant-id',
    VE_ENV: process.env.VE_ENV || 'your-environment.videoengager.com',
    VE_DEPLOYMENT_ID: process.env.VE_DEPLOYMENT_ID || 'your-deployment-id',
    
    // Your Genesys credentials  
    GENESYS_DEPLOYMENT_ID: process.env.GENESYS_DEPLOYMENT_ID || 'your-genesys-deployment',
    GENESYS_DOMAIN: process.env.GENESYS_DOMAIN || 'your-genesys-domain.com'
  };
</script>
```

### Compliance & Legal Considerations
- **Data Privacy**: Ensure compliance with GDPR, CCPA, and local privacy regulations
- **Accessibility**: Implement WCAG guidelines for public kiosk deployments
- **Terms of Service**: Add appropriate legal disclaimers and terms of use
- **Cookie Policies**: Implement cookie consent if tracking users

### Performance Optimization
- **Asset Optimization**: Minify CSS/JS, optimize images, implement caching headers
- **Resource Loading**: Configure preloading for critical resources
- **Progressive Enhancement**: Ensure graceful degradation for older browsers
- **Bandwidth Management**: Optimize for various network conditions

**Disclaimer**: This demo provides implementation patterns and best practices. VideoEngager provides the SDK and integration guidance, but production deployment, security, compliance, and maintenance are the sole responsibility of the implementing organization.

---

## Monitoring and Logging

### Log Levels
- **Development**: `debug` - All logs including detailed debugging
- **Staging**: `info` - General application flow and important events  
- **Production**: `error` - Only errors and critical issues

### Error Tracking
The application includes built-in error tracking with:
- Unique error IDs for support correlation
- Stack trace capture (development only)
- User agent and environment context
- Automatic retry attempt logging

### Performance Monitoring
- Connection state tracking
- Call duration measurement
- Error rate monitoring
- Timeout occurrence tracking

---

## Browser Support

- **Chrome/Chromium**: 88+ (recommended for kiosk deployments)
- **Firefox**: 85+
- **Safari**: 14+
- **Edge**: 88+

**Note**: Kiosk mode is optimized for Chrome's kiosk mode deployment.

---

## Troubleshooting

### Common Issues

**"Configuration validation failed"**
- Verify all required fields in your configuration
- Check environment variable names match exactly
- Ensure no undefined values in production config

**"Failed to load VideoEngager script"**
- Check internet connectivity
- Verify CDN access (cdn.videoengager.com)
- Check for corporate firewall blocking

**"VideoEngager ready timeout"**
- Verify tenant ID and environment are correct
- Check Genesys deployment ID validity
- Review browser console for detailed errors

**Video call not starting**
- Confirm VideoEngager deployment configuration
- Check camera/microphone permissions
- Verify Genesys domain accessibility

### Debug Mode

Enable debug logging by adding URL parameter:
```
?env=development
```

Or set configuration directly:
```javascript
monitoring: {
  enabled: true,
  level: "debug"
}
```

### Support Information

For VideoEngager-specific issues:
- Review the [VideoEngager Documentation](https://docs.videoengager.com)
- Check your tenant configuration
- Verify SDK version compatibility

For Genesys integration issues:
- Confirm deployment ID and domain
- Check Genesys Cloud organization settings
- Verify chat deployment configuration

---

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Follow the existing code style** and TypeScript annotations
3. **Add tests** for new functionality where applicable
4. **Update documentation** for any API changes
5. **Test thoroughly** across supported browsers
6. **Submit a pull request** with a clear description

### Development Setup
```bash
# Clone and setup
git clone <your-fork>
cd kiosk-production-ready
npm install

# Run development server with live reload
npm run dev

# Run tests (if available)
npm test

# Type checking (if using TypeScript)
npm run type-check
```

---

## License

This project is licensed under the MIT License. See [LICENSE.md](LICENSE.md) for details.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/VideoEngager/videoengager.github.io/issues)
- **Documentation**: [VideoEngager Docs](https://docs.videoengager.com)
- **Community**: [VideoEngager Community](https://community.videoengager.com)

For enterprise support and custom integrations, contact VideoEngager directly.