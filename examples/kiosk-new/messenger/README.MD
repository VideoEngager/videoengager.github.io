# VideoEngager Hub Kiosk Implementation

A modern video engagement solution for kiosk deployments using VideoEngager Hub with Genesys Messenger integration.

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Implementation Guide](#implementation-guide)
6. [Event System](#event-system)
7. [Queue and Skill Routing](#queue-and-skill-routing)
8. [Error Handling](#error-handling)
9. [Testing and Debugging](#testing-and-debugging)
10. [Best Practices](#best-practices)
11. [Migration from Legacy Genesys WebChat](#migration-from-legacy-genesys-webchat)
12. [API Differences](#api-differences)
13. [Support and Resources](#support-and-resources)

## Overview

This implementation provides a streamlined approach to video engagement in kiosk environments using the VideoEngager Hub platform. The solution integrates seamlessly with Genesys Messenger to deliver high-quality video interactions with minimal configuration complexity.

### Key Features

- **Simple Integration**: Single SDK dependency with clean API
- **Modern Architecture**: Built on VideoEngager Hub platform
- **Flexible Routing**: Queue and skill routing handled by Genesys Architect
- **Real-time Events**: Comprehensive event system for session management
- **Kiosk Optimized**: Designed specifically for unattended kiosk deployments

## Getting Started

### Prerequisites

- VideoEngager Hub account and tenant ID
- Genesys Cloud organization with Messenger configured
- Basic understanding of JavaScript and HTML

## Installation

### Method 1: Separate Configuration File (Recommended)

This is the approach used in the actual kiosk implementation. Create a separate configuration file and load scripts with defer:

**1. Create `config/conf.js`:**
```javascript
window.__VideoEngagerConfigs = {
  videoEngager: {
    tenantId: 'YOUR_TENANT_ID',
    veEnv: 'staging.leadsecure.com', // or 'videome.leadsecure.com' for production
    isPopup: false, // true for popup video, false for inline
    customAttributes: {
      'context.firstname': 'Kiosk',
      'context.lastname': 'Visitor',
      'location': 'lobby_kiosk_01',
      'device_type': 'kiosk',
      'department': 'customer_service'
    },
    debug: true, // Enable debug mode
    firstMessage: 'Welcome! Starting your video session...'
  },
  genesys: {
    debug: true,
    deploymentId: 'YOUR_DEPLOYMENT_ID',
    domain: 'mypurecloud.com' // or your Genesys domain
    // alternatively use: environment: 'us-east-1'
  },
  logger: true, // Enable logging for debugging
  useGenesysMessengerChat: false // Set to true to enable Genesys chat functions
};
```

**2. Load scripts in HTML:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VideoEngager Kiosk</title>
    
    <!-- Load configuration first -->
    <script src="./config/conf.js" defer></script>
    <!-- Load VideoEngager Hub (auto-initializes with config) -->
    <script src="https://cdn.videoengager.com/widget/latest/browser/genesys-hub.umd.js" defer></script>
    <!-- Your application script -->
    <script src="./js/kiosk.js" defer></script>
</head>
<body>
    <div id="kiosk-container">
        <button id="start-video-btn">Start Video Call</button>
        <div id="video-container"></div>
    </div>
</body>
</html>
```

**3. Use `waitForReady()` in your application:**
```javascript
// In your kiosk.js file
async function initializeKiosk() {
  try {
    if (typeof VideoEngager === 'undefined') {
      throw new Error('VideoEngager Hub is not loaded');
    }
    
    // Wait for VideoEngager to be ready (auto-initialized from config)
    await VideoEngager.waitForReady();
    console.log('VideoEngager Hub is ready');
    
    // Set up your kiosk interface
    setupKioskInterface();
  } catch (error) {
    console.error('Failed to initialize VideoEngager:', error);
    handleError(error);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeKiosk);
```

### Method 2: Inline Configuration (Alternative)

If you prefer to configure everything in the HTML file:

```html
<script>
window.__VideoEngagerConfigs = {
  videoEngager: {
    tenantId: 'YOUR_TENANT_ID',
    veEnv: 'staging.leadsecure.com',
    customAttributes: {
      'location': 'lobby_kiosk_01',
      'device_type': 'kiosk'
    }
  },
  genesys: {
    deploymentId: 'YOUR_DEPLOYMENT_ID',
    domain: 'mypurecloud.com'
  },
  useGenesysMessengerChat: false
};
</script>
<script src="https://cdn.videoengager.com/widget/latest/browser/genesys-hub.umd.js" defer></script>
```

## Configuration

### Configuration File Structure

When using the separate configuration file approach, the `window.__VideoEngagerConfigs` object should be structured as follows:

```javascript
window.__VideoEngagerConfigs = {
  videoEngager: {
    tenantId: 'your_tenant_id',
    veEnv: 'staging.leadsecure.com', // or 'videome.leadsecure.com' for production
    isPopup: false, // true for popup video, false for inline video
    customAttributes: {
      'location': 'lobby_kiosk_01',
      'device_type': 'kiosk',
      'department': 'customer_service',
      'context.firstname': 'Kiosk', // Context attributes for Genesys
      'context.lastname': 'Visitor'
    },
    debug: true, // Enable debug mode for development
    firstMessage: 'Welcome! Starting your video session...' // Message sent to agent
  },
  genesys: {
    debug: true, // Enable debug mode for Genesys
    deploymentId: 'your_deployment_id',
    domain: 'mypurecloud.com' // Use domain OR environment, not both
    // Alternative: environment: 'us-east-1'
  },
  logger: true, // Enable logging for debugging
  useGenesysMessengerChat: false // Set to true only if using Genesys chat functions
};
```

### Configuration Options Explained

#### Required VideoEngager Settings
- `tenantId`: Your VideoEngager tenant ID (required)
- `veEnv`: VideoEngager environment domain (required)
  - `'staging.leadsecure.com'` for staging/development
  - `'videome.leadsecure.com'` for production

#### Required Genesys Settings
- `deploymentId`: Your Genesys deployment ID (required)
- **Either** `domain` OR `environment` (not both):
  - `domain`: Genesys domain (e.g., 'mypurecloud.com', 'mypurecloud.ie')
  - `environment`: Genesys environment (e.g., 'us-east-1', 'eu-west-1')

#### Optional Settings
- `isPopup`: Boolean for popup vs inline video (default: false)
- `debug`: Enable debug logging (default: false)
- `logger`: Enable general logging (default: false)
- `useGenesysMessengerChat`: Enable Genesys chat functions (default: false)
- `firstMessage`: Custom message sent to agent when session starts

#### Custom Attributes
All custom attribute values must be strings. Common patterns:

```javascript
customAttributes: {
  // Location-based routing
  'location': 'downtown_branch',
  'floor': '2',
  'department': 'customer_service',
  
  // Context attributes (Genesys-specific)
  'context.firstname': 'John',
  'context.lastname': 'Doe',
  'subject': 'Video Support Request',
  
  // Business attributes
  'priority': 'high',        // string, not boolean
  'customer_type': 'premium',
  'language': 'en',
  
  // Device/kiosk attributes
  'device_type': 'kiosk',
  'kiosk_id': 'lobby_001',
  'operating_hours': '24/7'
}
```

## Implementation Guide

### Step 1: Wait for VideoEngager to be Ready

With the configuration file approach, VideoEngager auto-initializes. You just need to wait for it to be ready:

```javascript
async function initializeKiosk() {
  try {
    // Check if VideoEngager is loaded
    if (typeof VideoEngager === 'undefined') {
      throw new Error('VideoEngager Hub is not loaded');
    }
    
    // Wait for auto-initialization to complete
    await VideoEngager.waitForReady();
    console.log('VideoEngager Hub is ready');
    
    // Now set up your kiosk interface
    setupKioskInterface();
  } catch (error) {
    console.error('Failed to initialize VideoEngager:', error);
    handleError(error);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeKiosk);
```

### Step 2: Set Up Event Listeners

```javascript
function setupEventListeners() {
  // Listen for video session events
  VideoEngager.on('VideoEngagerCall.started', function(data) {
    console.log('Video session started:', data);
    hideStartButton();
    showVideoInterface();
  });

  VideoEngager.on('VideoEngagerCall.ended', function(data) {
    console.log('Video session ended:', data);
    showStartButton();
    hideVideoInterface();
    resetInactivityTimer(); // Reset kiosk after call
  });

  VideoEngager.on('VideoEngagerCall.agentJoined', function(data) {
    console.log('Agent joined the call:', data);
    updateKioskStatus('Connected to agent');
  });

  // Listen for Genesys Messenger events (if using messenger)
  VideoEngager.on('GenesysMessenger.conversationStarted', function(data) {
    console.log('Genesys conversation started:', data);
  });

  VideoEngager.on('GenesysMessenger.conversationEnded', function(data) {
    console.log('Genesys conversation ended:', data);
    resetKioskInterface();
  });
}
```

### Step 3: Update Custom Attributes (Optional)

Since attributes are set in the config file, you may only need to update them dynamically:

```javascript
function updateKioskAttributes() {
  // Only update if you need to change attributes dynamically
  VideoEngager.setCustomAttributes({
    'session_timestamp': new Date().toISOString(),
    'kiosk_session_id': generateSessionId()
  });
}
```

### Step 4: Start Video Session

```javascript
function startVideoCall() {
  try {
    // Optionally update attributes before starting
    updateKioskAttributes();
    
    // Start the video session (no parameters needed, uses config)
    VideoEngager.startVideoChatSession().then(() => {
      console.log('Video session started successfully');
      setCallTimeout(); // Set timeout for kiosk mode
    }).catch((error) => {
      console.error('Failed to start video session:', error);
      handleError(error);
    });
  } catch (error) {
    console.error('Error starting video call:', error);
    handleError(error);
  }
}
```

### Step 5: Complete Kiosk Setup

```javascript
function setupKioskInterface() {
  // Set up main button
  const startButton = document.getElementById('start-video-btn');
  if (startButton) {
    startButton.addEventListener('click', startVideoCall);
  }
  
  // Set up event listeners
  setupEventListeners();
  
  // Set up kiosk-specific features
  setupInactivityTimer();
  setupCallTimeout();
  
  // Show the interface
  showKioskInterface();
}

// Helper functions for kiosk management
function setCallTimeout() {
  // Cancel call after 3 minutes for kiosk mode
  setTimeout(() => {
    VideoEngager.endVideoChatSession();
  }, 180000); // 3 minutes
}

function setupInactivityTimer() {
  let inactivityTimer;
  
  function resetTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      window.location.reload(); // Reset kiosk
    }, 300000); // 5 minutes of inactivity
  }
  
  // Reset timer on user interaction
  document.addEventListener('click', resetTimer);
  document.addEventListener('touch', resetTimer);
  resetTimer(); // Start timer
}

// UI helper functions
function hideStartButton() {
  document.getElementById('start-video-btn').style.display = 'none';
}

function showStartButton() {
  document.getElementById('start-video-btn').style.display = 'block';
}

function showVideoInterface() {
  document.getElementById('video-container').style.display = 'block';
}

function hideVideoInterface() {
  document.getElementById('video-container').style.display = 'none';
}

function updateKioskStatus(message) {
  const statusElement = document.getElementById('kiosk-status');
  if (statusElement) {
    statusElement.textContent = message;
  }
}

function resetKioskInterface() {
  setTimeout(() => {
    window.location.reload(); // Reset kiosk to initial state
  }, 3000);
}
```

## Event System

### Available Events

| Event | Description | Data |
|-------|-------------|------|
| `VideoEngagerCall.started` | Video session has started and widget is loaded | `{ timestamp, sessionData }` |
| `VideoEngagerCall.ended` | Video session has ended and widget is removed | `{ timestamp, duration }` |
| `VideoEngagerCall.agentJoined` | Agent has joined the call (can fire multiple times) | `{ agent, timestamp }` |
| `GenesysMessenger.opened` | Genesys Messenger UI is opened | `{ timestamp }` |
| `GenesysMessenger.closed` | Genesys Messenger UI is closed | `{ timestamp }` |
| `GenesysMessenger.conversationStarted` | Genesys conversation started from SDK | `{ conversationId, timestamp }` |
| `GenesysMessenger.conversationEnded` | Genesys conversation ended from SDK | `{ conversationId, timestamp }` |

### Event Usage Examples

```javascript
// Subscribe to events
VideoEngager.on('VideoEngagerCall.started', function(data) {
    updateKioskStatus('Video call active');
    console.log('Video call started at:', data.timestamp);
});

VideoEngager.on('VideoEngagerCall.agentJoined', function(data) {
    updateKioskStatus('Connected to agent: ' + (data.agent?.name || 'Agent'));
});

VideoEngager.on('VideoEngagerCall.ended', function(data) {
    updateKioskStatus('Call ended. Thank you!');
    setTimeout(resetKioskInterface, 3000);
});

// Unsubscribe from events
VideoEngager.off('VideoEngagerCall.started', handlerFunction);

// Or use the returned unsubscribe function
const unsubscribe = VideoEngager.on('VideoEngagerCall.started', handlerFunction);
unsubscribe(); // Call this to unsubscribe
```

## Queue and Skill Routing

### Overview

Queue and skill routing in VideoEngager Hub is handled differently than traditional Genesys WebChat implementations. Instead of passing queue names or skill requirements directly through the VideoEngager SDK, routing decisions are managed by **Genesys Architect** flows.

### How Routing Works

1. **VideoEngager Hub** initiates the session with metadata
2. **Genesys Architect** receives the session data and metadata
3. **Architect flows** determine routing based on:
   - Metadata attributes
   - Business rules
   - Agent availability
   - Time of day/routing schedules

### Passing Custom Attributes

Custom attributes for routing should be set using the `setCustomAttributes()` method. All values must be strings:

```javascript
// Set custom attributes for routing
VideoEngager.setCustomAttributes({
    'location': 'downtown_branch',
    'department': 'mortgage_loans',
    'service_type': 'account_opening',
    'priority': 'high',
    'language': 'en',
    'customer_type': 'premium',
    'product_interest': 'investment_services',
    'kiosk_id': 'kiosk_001',
    'device_type': 'kiosk'
});
```

### Alternative: Set During Initialization

You can also set custom attributes during initialization:

```javascript
VideoEngager.initialize({
  videoEngager: {
    tenantId: 'your_tenant_id',
    veEnv: 'staging.leadsecure.com',
    customAttributes: {
      'location': 'downtown_branch',
      'department': 'mortgage_loans',
      'device_type': 'kiosk'
    }
  },
  genesys: {
    deploymentId: 'your_deployment_id',
    environment: 'us-east-1'
  },
  useGenesysMessengerChat: true
});
```

### Genesys Architect Configuration

In your Genesys Architect flow, you can access these attributes and route accordingly:

```
1. Receive VideoEngager session
2. Extract metadata attributes
3. Apply routing logic:
   - If location = "downtown_branch" AND department = "mortgage_loans"
     → Route to Mortgage Specialists queue
   - If priority = "high"
     → Route to Priority queue
   - If language = "es"
     → Route to Spanish-speaking agents
4. Transfer to appropriate queue/skill group
```

### Example Routing Scenarios

#### Scenario 1: Location-Based Routing
```javascript
metadata: {
    location: 'airport_terminal_1',
    service_type: 'customer_service'
}
// Architect routes to Airport Customer Service queue
```

#### Scenario 2: Service-Specific Routing
```javascript
metadata: {
    department: 'technical_support',
    product: 'mobile_banking',
    issue_type: 'login_problem'
}
// Architect routes to Mobile Banking Technical Support
```

#### Scenario 3: Priority Routing
```javascript
metadata: {
    customer_tier: 'platinum',
    service_type: 'account_issue',
    priority: 'urgent'
}
// Architect routes to Platinum Customer Priority queue
```

### Benefits of This Approach

- **Centralized Routing Logic**: All routing rules managed in Genesys Architect
- **Dynamic Routing**: Rules can be changed without updating kiosk code
- **Complex Logic Support**: Supports sophisticated routing algorithms
- **Real-time Adjustments**: Routing can adapt to agent availability and business hours

## Error Handling

### Common Error Types

```javascript
VideoEngager.on('error', function(error) {
    console.error('VideoEngager Error:', error);
    
    switch(error.type) {
        case 'network':
            handleNetworkError(error);
            break;
        case 'session':
            handleSessionError(error);
            break;
        case 'configuration':
            handleConfigurationError(error);
            break;
        case 'permissions':
            handlePermissionsError(error);
            break;
        default:
            handleGeneralError(error);
    }
});
```

### Error Handling Implementation

```javascript
function handleNetworkError(error) {
    showUserMessage('Connection error. Please check your internet connection.');
    // Retry logic or fallback options
}

function handleSessionError(error) {
    showUserMessage('Unable to start video session. Please try again.');
    resetKioskInterface();
}

function handleConfigurationError(error) {
    console.error('Configuration error:', error.message);
    // Log for administrator review
}

function handlePermissionsError(error) {
    showUserMessage('Camera/microphone access required for video calls.');
    // Guide user through permission setup
}
```

## Testing and Debugging

### Development Mode

Enable debug mode for detailed logging:

```javascript
VideoEngager.init({
    tenant_id: 'your_tenant_id',
    environment: 'staging',
    debug: true
});
```

### Console Testing Commands

Test functionality directly in the browser console:

```javascript
// Check SDK status
VideoEngager.getStatus();

// Test session start
VideoEngager.startVideoChatSession({ 
    type: 'kiosk',
    visitor_token: 'test_' + Date.now()
});

// Check current session state
VideoEngager.getSessionState();

// End current session
VideoEngager.endVideoChatSession();

// Test metadata passing
VideoEngager.startVideoChatSession({
    type: 'kiosk',
    metadata: {
        test_location: 'debug_kiosk',
        test_department: 'qa_testing'
    }
});
```

### Debugging Tips

1. **Enable browser console** to see VideoEngager logs
2. **Use staging environment** for testing
3. **Test with different metadata combinations** to verify routing
4. **Monitor network tab** for API calls
5. **Test error scenarios** (network disconnection, permission denial)

## Best Practices

### 1. Session Management
- Always wait for the `ready` event before starting sessions
- Implement proper cleanup when sessions end
- Use meaningful visitor tokens for tracking
- Handle session timeouts gracefully

### 2. Error Handling
- Implement comprehensive error handling for all error types
- Provide clear user feedback for different error scenarios
- Log errors for monitoring and debugging
- Have fallback options for critical failures

### 3. Kiosk-Specific Considerations
- Implement inactivity timeouts to reset the interface
- Clear any sensitive data between sessions
- Provide clear visual feedback for session states
- Consider accessibility requirements

### 4. Metadata Best Practices
- Use consistent naming conventions for metadata attributes
- Include relevant context for routing decisions
- Keep metadata values simple and standardized
- Document metadata schema for Architect flow developers

### 5. Performance Optimization
- Minimize DOM manipulations during video sessions
- Use efficient event handling
- Preload necessary resources
- Implement proper memory management

## Migration from Legacy Genesys WebChat

### Overview

This section provides guidance for migrating from the legacy Genesys WebChat widget implementation to the modern VideoEngager Hub approach.

### Key Benefits of Migration

1. **Simplified Integration** - Single SDK dependency instead of multiple Genesys widgets
2. **Enhanced Reliability** - Direct VideoEngager control over session lifecycle
3. **Modern Event System** - Standardized event naming and data structures
4. **Reduced Dependencies** - Smaller footprint and faster loading
5. **Future-Proof Architecture** - Built on modern VideoEngager Hub platform

### Architecture Comparison

| Aspect | Legacy Genesys WebChat | VideoEngager Hub |
|--------|----------------------|-------------------|
| **Primary API** | CXBus commands with Genesys WebChat | VideoEngager Hub API |
| **Dependencies** | Genesys WebChat widgets + CXBus | VideoEngager Hub SDK |
| **Event System** | CXBus.subscribe() | VideoEngager.on() |
| **Session Management** | Complex CXBus command sequences | Simplified Hub API methods |
| **Configuration** | Genesys widget configuration objects | Streamlined VideoEngager config |

### Migration Steps

#### Step 1: Update Dependencies

**Remove Legacy Dependencies:**
```html
<!-- Remove these Genesys WebChat includes -->
<script src="genesys-webchat-widget.js"></script>
<script src="cxbus.min.js"></script>
```

**Add VideoEngager Hub:**
```html
<!-- Add VideoEngager Hub SDK -->
<script>
(function(g,s,c,d,q){
  q=[];g.__VideoEngagerQueue=q;g.__VideoEngagerConfigs=c;g.VideoEngager=new Proxy({},{ get:(_,m)=>(...a)=>new Promise((r,rj)=>q.push({m,a,r,rj}))});
  d=document.createElement("script");d.async=1;d.src=s;d.charset="utf-8";document.head.appendChild(d);
})(window,"https://cdn.videoengager.com/widget/latest/browser/genesys-hub.umd.js",{
  // Configuration here
});
</script>
```

#### Step 2: Replace Initialization

**Legacy Approach:**
```javascript
// Complex Genesys widget initialization
_genesys.widgets.main({
    dataURL: 'https://...',
    userData: { /* complex config */ },
    form: { /* form config */ }
});
```

**Modern Approach:**
```javascript
// Simple VideoEngager initialization
VideoEngager.initialize({
    videoEngager: {
        tenantId: 'your_tenant_id',
        veEnv: 'staging.leadsecure.com'
    },
    genesys: {
        deploymentId: 'your_deployment_id',
        environment: 'us-east-1'
    },
    useGenesysMessengerChat: true
});
```

#### Step 3: Update Session Management

**Legacy Session Start:**
```javascript
CXBus.command('WebChatService.requestChat', {
    userData: {
        // Complex user data object
    },
    form: {
        // Form configuration
    }
});
```

**Modern Session Start:**
```javascript
// Set custom attributes first
VideoEngager.setCustomAttributes({
    'location': 'kiosk_01',
    'department': 'customer_service'
});

// Start video session (no parameters)
VideoEngager.startVideoChatSession();
```

**Legacy Session End:**
```javascript
CXBus.command('WebChatService.endChat');
```

**Modern Session End:**
```javascript
VideoEngager.endVideoChatSession();
```

#### Step 4: Update Event Handling

**Legacy Event Subscriptions:**
```javascript
CXBus.subscribe('WebChatService.chatEnded', function(data) {
    handleChatEnd(data);
});

CXBus.subscribe('WebChatService.chatStarted', function(data) {
    handleChatStart(data);
});

CXBus.subscribe('WebChatService.error', function(error) {
    handleError(error);
});
```

**Modern Event Subscriptions:**
```javascript
VideoEngager.on('VideoEngagerCall.ended', function(data) {
    handleSessionEnd(data);
});

VideoEngager.on('VideoEngagerCall.started', function(data) {
    handleSessionStart(data);
});

VideoEngager.on('GenesysMessenger.conversationEnded', function(data) {
    handleConversationEnd(data);
});
```

### Configuration Migration

**Legacy Complex Configuration:**
```javascript
const legacyConfig = {
    dataURL: 'https://api.mypurecloud.com',
    userData: {
        addressStreet: '',
        addressCity: '',
        customAttribute1: 'kiosk',
        customAttribute2: 'lobby'
    },
    form: {
        autoSubmit: true,
        firstname: '',
        lastname: '',
        email: '',
        subject: 'Video Call Request'
    }
};
```

**Modern Simplified Configuration:**
```javascript
const modernConfig = {
    videoEngager: {
        tenantId: 'your_tenant_id',
        veEnv: 'staging.leadsecure.com',
        customAttributes: {
            'location': 'lobby',
            'device_type': 'kiosk',
            'department': 'customer_service'
        }
    },
    genesys: {
        deploymentId: 'your_deployment_id',
        environment: 'us-east-1'
    },
    useGenesysMessengerChat: true
};
```

## API Differences

### Session Management APIs

| Function | Legacy (CXBus) | Modern (VideoEngager Hub) |
|----------|----------------|---------------------------|
| Start Session | `CXBus.command('WebChatService.requestChat', config)` | `VideoEngager.startVideoChatSession()` |
| End Session | `CXBus.command('WebChatService.endChat')` | `VideoEngager.endVideoChatSession()` |
| Set Attributes | Complex userData in config | `VideoEngager.setCustomAttributes(attrs)` |

### Event System APIs

| Event Type | Legacy (CXBus) | Modern (VideoEngager Hub) |
|------------|----------------|---------------------------|
| Session Started | `CXBus.subscribe('WebChatService.chatStarted', handler)` | `VideoEngager.on('VideoEngagerCall.started', handler)` |
| Session Ended | `CXBus.subscribe('WebChatService.chatEnded', handler)` | `VideoEngager.on('VideoEngagerCall.ended', handler)` |
| Agent Joined | N/A | `VideoEngager.on('VideoEngagerCall.agentJoined', handler)` |
| Remove Listener | `CXBus.unsubscribe('event', handler)` | `VideoEngager.off('event', handler)` |

### Configuration APIs

| Configuration | Legacy Approach | Modern Approach |
|---------------|----------------|-----------------|
| User Data | Complex `userData` object in widget config | `setCustomAttributes()` method |
| Queue Routing | Direct queue specification in widget | Custom attributes + Genesys Architect routing |
| Form Data | Form configuration in widget setup | Custom attributes for routing |
| Initialization | `_genesys.widgets.main(config)` | `VideoEngager.initialize(config)` |

### Readiness Check APIs

| Check | Legacy (CXBus) | Modern (VideoEngager Hub) |
|-------|----------------|---------------------------|
| Ready Callback | CXBus ready events | `VideoEngager.onReady(callback)` |
| Ready Promise | N/A | `VideoEngager.waitForReady()` |

## Support and Resources

### Documentation
- **VideoEngager Hub API Reference**: [Hub Documentation]
- **Genesys Messenger Integration Guide**: [Integration Documentation]
- **Kiosk Implementation Examples**: See `/examples/kiosk-new/` directory

### Support Channels
- **Technical Support**: Contact VideoEngager support team

### Version Information
- **Current Version**: VideoEngager Hub v2.x
- **Legacy Version**: Genesys WebChat widget implementation (deprecated)
- **Migration Support**: Available through Q2 2025
