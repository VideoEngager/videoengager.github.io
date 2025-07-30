# VideoEngager Agent SDK Demo

A comprehensive demonstration of the VideoEngager Agent SDK implementation with a clean, modern web interface. This demo showcases how to integrate video calling capabilities into your web application using the VideoEngager Agent SDK with generic authentication.

## Features

- **Clean, Modern UI** - Professional interface with responsive design
- **Real-time Status Updates** - Visual indicators for SDK and call states
- **Event Logging** - Comprehensive logging of all SDK events and actions
- **Call Management** - Start and end video calls with optional customer identification
- **Error Handling** - Graceful error handling with user-friendly messages
- **Custom UI Handlers** - Demonstrates custom iframe management for video sessions

## Prerequisites

- A valid VideoEngager account and API key
- A configured VideoEngager domain
- An agent email address registered in your VideoEngager system
- Modern web browser with ES6 module support

## Getting Started

### 1. Setup Files

Ensure you have the following files in your project directory:
- `index.html` - Main application interface
- `script.mjs` - JavaScript module with SDK integration logic

### 2. Configuration Parameters

The demo requires the following configuration parameters:

#### Required Parameters
- **API Key** - Your VideoEngager API key for authentication
- **Domain** - Your VideoEngager domain (e.g., `your-domain.videome.leadsecure.com`)
- **Agent Email** - The email address of the agent using the system

#### Optional Parameters
- **Organization ID** - Your organization identifier (if applicable)
- **Customer ID** - Customer identifier for call tracking (can be set per call)

### 3. Running the Demo

1. Open `index.html` in a modern web browser
2. Fill in the required configuration parameters in the form
3. Click "Initialize SDK" to set up the VideoEngager connection
4. Once initialized, use "Start Call" to begin a video session
5. Monitor the event log for real-time updates

## Application Architecture

### Core Components

- **Configuration Management** - Handles SDK initialization parameters
- **Status Monitoring** - Real-time display of SDK and call states
- **Call Controls** - User interface for managing video sessions
- **Event Logging** - Comprehensive logging system for debugging
- **Custom UI Handlers** - Custom iframe management for video display

### SDK Integration

The demo uses the VideoEngager Agent SDK (`videoengager-agent-sdk`) loaded from CDN:
```javascript
window.VideoEngagerAgent = await import('https://cdn.jsdelivr.net/npm/videoengager-agent-sdk@0.0.23/dist/index.min.mjs');
```

### Event Handling

The application listens for the following SDK events:
- `sessionStarted` - Video call begins
- `sessionEnded` - Video call ends  
- `sessionFailed` - Call fails to start
- `callStateUpdated` - Call state changes
- `cleanup` - SDK cleanup initiated

## API Usage Examples

### SDK Initialization
```javascript
await window.VideoEngagerAgent.init({
    authMethod: 'generic',
    apiKey: 'your-api-key',
    domain: 'your-domain.videome.leadsecure.com', 
    agentEmail: 'agent@yourcompany.com',
    options: {
        containerId: 'video-container',
        uiHandlers: customUIHandlers
    }
});
```

### Starting a Call
```javascript
// With customer ID
await window.VideoEngagerAgent.call({
    customerId: 'customer-123'
});

// Without customer ID
await window.VideoEngagerAgent.call();
```

### Ending a Call
```javascript
await window.VideoEngagerAgent.endCall();
```

## UI Features

### Status Indicators
- **Gray Dot** - Not initialized
- **Yellow Dot (pulsing)** - Initializing
- **Green Dot** - Successfully initialized
- **Red Dot** - Error state

### Call Information Display
When a call is active, the interface displays:
- Call status
- Visitor ID
- Agent email
- Call PIN
- Short URL for customer access
- Active session status
- Tenant ID

### Event Log
The event log provides real-time information about:
- SDK initialization progress
- Call state changes
- Error messages and debugging information
- System events and notifications

## Error Handling

The demo includes comprehensive error handling for:
- SDK initialization failures
- Call start/end failures
- Network connectivity issues
- Invalid configuration parameters
- Missing required fields

Errors are displayed both in the UI and logged to the browser console for debugging.

## Browser Compatibility

This demo requires:
- ES6 module support
- Modern JavaScript features (async/await, destructuring)
- WebRTC support for video calling
- Camera and microphone permissions

Recommended browsers:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Troubleshooting

### Common Issues

1. **SDK fails to initialize**
   - Verify API key is correct
   - Check domain format (should include full domain)
   - Ensure agent email is registered in VideoEngager

2. **Call fails to start**
   - Check network connectivity
   - Verify camera/microphone permissions
   - Ensure SDK is properly initialized

3. **Video not displaying**
   - Check browser console for iframe errors
   - Verify video container element exists
   - Ensure proper permissions are granted

### Debug Information

The application exposes debugging utilities:
```javascript
// Access application state
console.log(window.videoEngagerDemo.state);

// Access DOM elements
console.log(window.videoEngagerDemo.elements);

// Manual logging
window.videoEngagerDemo.logEvent('Custom message', 'info');
```

## Security Considerations

- Never expose API keys in client-side code in production
- Use environment variables or secure configuration management
- Implement proper authentication and authorization
- Consider using server-side proxy for API key management

### Getting Help

- **Issues**: [Video Engager Helpdesk](https://help.videoengager.com/hc/en-us/requests/new)
- **Dev Documentation**: [VideoEngager Docs](https://videoengager.github.io/videoengager.widget/#/)
- **User Documentation**: [VideoEngager Helpdesk](https://help.videoengager.com/)
- **Additional SDK Documentation**: [VideoEngager Agent SDK Github](https://github.com/VideoEngager/videoengager-agent-sdk/blob/main/README.md)

For enterprise support and custom integrations, contact VideoEngager Support <a href="mailto:support@videoengager.com">support@videoengager.com</a> directly.

---

## License

This project is licensed under the MIT License. See [LICENSE.md](LICENSE.md) for details.