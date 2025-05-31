# VideoEngager Kiosk Demo - Production Ready

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)

A comprehensive, self-service kiosk application demonstrating VideoEngager's video calling capabilities integrated with Genesys Cloud. Built with vanilla JavaScript ES modules, this example provides enterprise-grade patterns for error handling, multi-environment support, and waitroom management.

---

## Features

- **Zero-dependency** vanilla JavaScript implementation with ES modules
- **Multi-environment support** (development, staging, production) with automatic detection
- **Comprehensive error handling** with categorized error types and retry mechanisms
- **Custom waitroom experience** with carousel slides and bot messaging
- **Internationalization** support (English, German, Arabic)
- **Timeout management** for calls, inactivity, and system operations
- **Security-focused** architecture with input sanitization and XSS protection
- **Event-driven architecture** with proper separation of concerns
- **TypeScript annotations** for better developer experience

---

## Architecture Overview

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Kiosk Application                        │
├─────────────────────────────────────────────────────────────┤
│  KioskApplication (Main Orchestrator)                      │
│  ├── VideoEngagerClient (SDK Integration)                  │
│  ├── ErrorHandler (Error Management)                       │
│  ├── TimeoutManager (Timer Management)                     │
│  ├── WaitroomEventMediator (Event Bridge)                  │
│  └── VECarouselWaitroom (Custom Element)                   │
├─────────────────────────────────────────────────────────────┤
│  EnvironmentConfig (Configuration Management)              │
│  └── Utils (Utility Functions)                             │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
├── js/
│   ├── client.js                    # VideoEngager SDK integration
│   ├── kiosk.js                     # Main application orchestrator
│   ├── error-handler.js             # Comprehensive error management
│   ├── timeout-manager.js           # Centralized timeout handling
│   ├── utils.js                     # Utility functions
│   ├── ve-carousel-waitroom.js      # Custom waitroom component
│   └── waitroom-event-mediator.js   # Event bridge for waitroom
├── config/
│   ├── conf.js                      # Environment configurations
│   ├── environment.js               # Environment detection logic
│   └── waitroom.json                # Waitroom carousel configuration
├── css/
│   ├── styles.css                   # Main application styles
│   └── carousel.css                 # Waitroom carousel styles
├── types/
│   └── ve-window.d.ts               # TypeScript definitions
└── index.html                       # Application entry point
```

---

## Getting Started

### Prerequisites

- Modern web browser with ES module support
- VideoEngager tenant credentials
- Genesys Cloud deployment credentials
- Web server for hosting (local development or production)

### Quick Setup

1. **Clone or download the example:**
   ```bash
   # From VideoEngager examples repository
   git clone https://github.com/VideoEngager/videoengager.github.io
   cd videoengager.github.io/examples/kiosk-production-ready
   ```

2. **Configure your credentials:**
   Edit `config/conf.js` with your VideoEngager and Genesys settings:
   ```javascript
   const configs = {
     production: {
       videoEngager: {
         tenantId: 'your-tenant-id',
         veEnv: 'your-environment.videoengager.com',
         deploymentId: 'your-deployment-id',
       },
       genesys: {
         deploymentId: 'your-genesys-deployment-id',
         domain: 'your-genesys-domain.com',
       }
     }
   };
   ```

3. **Serve the application:**
   ```bash
   # Using Node.js
   npx http-server . -p 8080
   
   # Using Python
   python -m http.server 8080
   
   # Using PHP
   php -S localhost:8080
   ```

4. **Access the demo:**
   Open `http://localhost:8080` in your browser

---

## Configuration

### Environment Detection

The application automatically detects environments based on:

| Pattern | Environment | Description |
|---------|-------------|-------------|
| `?env=dev\|staging\|production` | URL Parameter | Explicit environment override |
| `localhost`, `127.0.0.1`, `dev.*` | Development | Local development patterns |
| `staging.*` | Staging | Staging environment patterns |
| Everything else | Production | Default production environment |

### Configuration Structure

```javascript
// config/conf.js
const configs = {
  dev: {
    videoEngager: {
      tenantId: "test_tenant",
      veEnv: "dev.videoengager.com",
      deploymentId: "test_deployment",
      veHttps: true,
      isPopup: false,
    },
    genesys: {
      deploymentId: "your-dev-deployment-id",
      domain: "mypurecloud.com.au",
      hideGenesysLauncher: false,
    },
    useGenesysMessengerChat: false
  }
  // staging, production configurations...
};
```

### Waitroom Customization

Configure the waitroom experience via `config/waitroom.json`:

```json
{
  "theme": {
    "primaryColor": "#006699",
    "font": "Open Sans",
    "mode": "default"
  },
  "carousel": {
    "loop": true,
    "interval": 8000,
    "slides": [
      {
        "type": "content",
        "title": "Welcome",
        "description": "Please wait for an agent",
        "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      },
      {
        "type": "image",
        "src": "https://example.com/image.jpg",
        "title": "Slide Title",
        "description": "Slide description"
      },
      {
        "type": "video", 
        "src": "https://example.com/video.mp4",
        "muted": true,
        "loop": true
      }
    ]
  }
}
```

---

## Core Components

### KioskApplication (`js/kiosk.js`)

Main application orchestrator that manages:
- UI state transitions between screens
- VideoEngager client initialization
- Event handling and coordination
- Language and customization
- Timeout and inactivity management

```javascript
// Usage example
const kiosk = new KioskApplication();
// Automatically initializes on DOM ready
```

### VideoEngagerClient (`js/client.js`)

Secure wrapper around the VideoEngager SDK:
- Dynamic script loading with integrity checks
- Promise-based API wrapper
- Event handling and error management
- Configuration proxy setup

```javascript
// Usage example
const client = new VideoEngagerClient(config);
await client.init();
await client.startVideo();
```

### VECarouselWaitroom (`js/ve-carousel-waitroom.js`)

Custom web component providing:
- Configurable slide carousel
- Multiple media types (images, videos, content)
- Bot messaging system
- Accessibility features
- Lazy loading for performance

```html
<!-- Usage in HTML -->
<ve-carousel-waitroom config-src="/config/waitroom.json"></ve-carousel-waitroom>
```

### ErrorHandler (`js/error-handler.js`)

Comprehensive error management system:
- Categorized error types with user-friendly messages
- Automatic retry logic with exponential backoff
- Modal display system
- Logging and monitoring integration

```javascript
// Error categories
const ErrorTypes = {
  NETWORK_ERROR: { shouldRetry: false },
  LIBRARY_LOAD_FAILED: { shouldRetry: true, retryDelay: 5000 },
  CONFIG_INVALID: { shouldRetry: false }
};
```

### TimeoutManager (`js/timeout-manager.js`)

Centralized timeout handling:
- Named timeout management
- Automatic cleanup
- Remaining time calculation

```javascript
const timeoutManager = new TimeoutManager();
timeoutManager.set('call', () => handleTimeout(), 180000); // 3 minutes
timeoutManager.clear('call');
```

---

## User Experience Flow

1. **Initial Screen**: Large start button with customizable background and language
2. **Loading State**: Waitroom carousel with slides and cancel option
3. **Video Call**: Full-screen video interface when agent joins
4. **Auto Return**: Automatic return to start after call ends or timeout
5. **Error Handling**: User-friendly error messages with retry options

### Supported Interactions

- **Start Call**: Touch/click the circular start button
- **Cancel Call**: X button during connection phase
- **Automatic Timeouts**: Configurable timeouts for calls and inactivity
- **Error Recovery**: Automatic retry for recoverable errors

---

## Language Support

Built-in support for multiple languages with URL parameter control:

```javascript
// Access via URL: ?lang=en|de|ar
this.languages = {
  en: {
    motto: "SmartVideo Kiosk Demo",
    connect: "Touch Here To Begin",
    loadingText: "Connecting to an Agent",
    cancelText: "Cancel"
  },
  de: {
    motto: "SmartVideo Kiosk Demo", 
    connect: "Verbinden",
    loadingText: "Verbinde mit einem Agenten",
    cancelText: "Abbrechen"
  },
  ar: {
    motto: "عرض توضيحي لسمارت فيديو كيوسك",
    connect: "الاتصال",
    loadingText: "جاري الاتصال بموظف خدمة العملاء",
    cancelText: "إلغاء"
  }
};
```

---

## Security Features

- **Input Sanitization**: All dynamic content is sanitized using `Utils.sanitizeText()`
- **XSS Protection**: HTML content sanitization for user-facing messages
- **URL Validation**: Strict validation for external resources
- **Error Information Disclosure**: Limited error details in production
- **CSP Compatible**: Works with Content Security Policy headers

### Security Best Practices Implemented

```javascript
// Example: Secure text sanitization
static sanitizeText(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[<>&"']/g, "");
}

// Example: URL validation
static validateURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
```

---

## Error Handling Strategy

The application implements a comprehensive error handling strategy:

### Error Categories

| Error Type | User Message | Retry | Use Case |
|------------|--------------|-------|----------|
| `NETWORK_ERROR` | Check internet connection | No | Connection issues |
| `CONFIG_INVALID` | Contact support | No | Configuration problems |
| `LIBRARY_LOAD_FAILED` | Refresh the page | Yes (5s) | CDN/script loading |
| `CALL_TIMEOUT` | Try again | Yes | Agent connection timeout |
| `INTERNAL_ERROR` | Service error occurred | Yes (5s) | General errors |

### Retry Logic

```javascript
// Automatic retry with exponential backoff
scheduleRetry(errorType, errorId) {
  const currentAttempts = parseInt(localStorage.getItem(errorType.code) || "0");
  
  if (currentAttempts >= this.maxRetryAttempts) {
    this.showToast("Maximum retry attempts reached", "error");
    return;
  }
  
  localStorage.setItem(errorType.code, String(currentAttempts + 1));
  setTimeout(() => window.location.reload(), errorType.retryDelay);
}
```

---

## Performance Optimization

### Lazy Loading
- Images and videos loaded on-demand
- Intersection Observer API for efficient loading
- Preloading of next slides for smooth transitions

### Resource Management
- Automatic cleanup of timeouts and event listeners
- Memory leak prevention in single-page application
- Efficient DOM manipulation

### Network Optimization
- CDN usage for external dependencies
- Minimal HTTP requests
- Optimized asset loading

---

## Browser Support

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome/Chromium | 88+ | Recommended for kiosk deployments |
| Firefox | 85+ | Full feature support |
| Safari | 14+ | iOS Safari compatible |
| Edge | 88+ | Chromium-based Edge |

**Note**: ES modules and modern JavaScript features require recent browser versions.

---

## Deployment Considerations

**Important**: This is a demo/example application for third-party developers. Production deployment and maintenance are the responsibility of the implementing organization.

### Third-Party Implementation Responsibilities

#### Infrastructure & Security
- **Web Server Configuration**: Deploy on your preferred hosting platform
- **SSL/TLS Setup**: Implement HTTPS with valid certificates  
- **Environment Variables**: Securely manage credentials and configuration
- **Content Security Policy**: Configure appropriate CSP headers
- **Access Control**: Implement authentication if required

#### Customization & Branding
- **Visual Design**: Apply your organization's branding and styling
- **Language Localization**: Add additional languages for your regions
- **Business Logic**: Implement custom integrations and workflows
- **Monitoring Integration**: Connect to your error tracking and analytics

#### Operations & Maintenance
- **Application Monitoring**: Integrate with your monitoring solutions
- **Error Tracking**: Connect to your error reporting systems  
- **Backup & Recovery**: Implement appropriate backup strategies
- **Performance Optimization**: Configure caching and CDN as needed

### Sample Environment Configuration

For production deployments, configure via environment variables:

```html
<script>
  window.ENV_CONFIG = {
    VE_TENANT_ID: 'your-tenant-id',
    VE_ENV: 'your-environment.videoengager.com', 
    VE_DEPLOYMENT_ID: 'your-deployment-id',
    GENESYS_DEPLOYMENT_ID: 'your-genesys-deployment',
    GENESYS_DOMAIN: 'your-genesys-domain.com'
  };
</script>
```

---

## Troubleshooting

### Common Issues

**"Configuration validation failed"**
- Verify all required fields in your configuration
- Check that environment variables are properly set
- Ensure no undefined values in production config

**"Failed to load VideoEngager script"**
- Check internet connectivity and CDN access
- Verify corporate firewall isn't blocking cdn.videoengager.com
- Review browser console for detailed network errors

**"VideoEngager ready timeout"**
- Confirm tenant ID and environment are correct
- Verify Genesys deployment ID is valid
- Check browser console for SDK initialization errors

**Video call not starting**
- Confirm VideoEngager deployment configuration
- Check camera/microphone permissions in browser
- Verify Genesys domain is accessible

### Debug Mode

Enable detailed logging:
```
# URL parameter
?env=dev

# Or modify configuration
monitoring: {
  enabled: true,
  level: "debug"
}
```

### Performance Debugging

Monitor the application state:
```javascript
// Check connection state
console.log(window.kioskApp.videoEngagerClient.getConnectionState());

// Check timeout status
console.log(window.kioskApp.timeoutManager.has('call'));

// Check current screen
console.log(window.kioskApp.currentScreen);
```

---

## Development

### Adding New Features

1. **Follow the modular architecture** - create new classes for distinct functionality
2. **Use TypeScript annotations** - maintain type safety with JSDoc comments
3. **Implement proper error handling** - use the ErrorHandler for consistent error management
4. **Add event listeners cleanup** - prevent memory leaks in destroy methods
5. **Test across environments** - verify functionality in dev, staging, and production configs

### Code Style Guidelines

```javascript
// Use JSDoc for type annotations
/**
 * @param {string} tenantId - The VideoEngager tenant ID
 * @param {Object} config - Configuration object
 * @returns {Promise<boolean>} Success status
 */
async function initializeClient(tenantId, config) {
  // Implementation
}

// Use proper error handling
try {
  await this.videoEngagerClient.startVideo();
} catch (error) {
  const errorId = this.errorHandler.handleError(ErrorTypes.INTERNAL_ERROR, error);
  this.emit('video:error', { error, errorId });
  throw error;
}
```

---

## API Reference

### KioskApplication

```javascript
// Public methods
await kioskApp.init()                    // Initialize application
kioskApp.showScreen('initial')           // Switch screens
kioskApp.log('message')                  // Application logging
kioskApp.destroy()                       // Cleanup resources

// Event handling
kioskApp.on('client:ready', callback)    // Client ready event
kioskApp.on('video:started', callback)   // Video call started
kioskApp.on('video:ended', callback)     // Video call ended
```

### VideoEngagerClient

```javascript
// Client lifecycle
const client = new VideoEngagerClient(config)
await client.init()                      // Initialize client
client.isReady()                         // Check ready state

// Video call methods
await client.startVideo()                // Start video call
await client.endVideo()                  // End video call

// Chat methods (if enabled)
await client.startChat()                 // Start chat session
await client.endChat()                   // End chat session
```

### WaitroomEventMediator

```javascript
// Event handling
mediator.on('ready', callback)           // Waitroom ready
mediator.on('slideChanged', callback)    // Slide change event
mediator.on('userCancelled', callback)   // User cancellation
mediator.on('error', callback)           // Error occured

// Control methods
mediator.sendBotMessage(message, tier)   // Display bot message
mediator.controlCarousel('play|pause')   // Control playback
mediator.goToSlide(index)                // Navigate to slide
```

---

## Support

**Note**: This is a demo application. VideoEngager provides the SDK and integration guidance, but production implementation, security, and maintenance are the responsibility of the implementing organization.

### Getting Help

- **Issues**: [Video Engager Helpdesk](https://help.videoengager.com/hc/en-us/requests/new)
- **Dev Documentation**: [VideoEngager Docs](https://videoengager.github.io/videoengager.widget/#/)
- **User Documentation**: [VideoEngager Helpdesk](https://help.videoengager.com/)


For enterprise support and custom integrations, contact VideoEngager Support <a href="mailto:support@videoengager.com">support@videoengager.com</a> directly.

---

## License

This project is licensed under the MIT License. See [LICENSE.md](LICENSE.md) for details.

---

**Disclaimer**: This demo provides implementation patterns and best practices. VideoEngager provides the SDK and integration guidance, but production deployment, security, compliance, and maintenance are the sole responsibility of the implementing organization.