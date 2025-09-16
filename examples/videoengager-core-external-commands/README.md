# VideoEngager Core - External Actions Example

A vanilla JavaScript demonstration showcasing **external video action execution** within the VideoEngager widget. This example shows how to control video call features (mute, camera, screen share, etc.) from outside the video iframe using the VideoEngager Core API.

## 🎯 What This Demo Demonstrates

This example demonstrates the core capabilities of VideoEngager's **external action execution system**:

- **External Video Controls**: Execute video actions (mute, camera toggle, screen share) from your application's UI
- **Real-time State Synchronization**: Track and respond to video call state changes
- **Event-driven Architecture**: Listen to VideoEngager events for seamless integration
- **Custom UI Integration**: Build custom control interfaces that interact with the video widget
- **Genesys Integration**: Direct integration with Genesys Cloud without WebSocket mocking

## 🚀 Key Features

### External Action Execution
- **Toggle Microphone**: `executeVideoCallFn('triggerMuteUnmute')`
- **Toggle Camera**: `executeVideoCallFn('triggerShowHideVideo')`
- **Screen Share**: `executeVideoCallFn('triggerScreenShare')`
- **Camera Switch**: `executeVideoCallFn('triggerSwitchCamera')`
- **End Call**: Standard `endVideoChatSession()` method

### Event Management
- **Video State Changes**: Real-time updates when user interacts with video controls
- **Session Lifecycle**: Track initialization, start, and end of video sessions
- **Integration Events**: Monitor Genesys session state and connection status

### Configuration System
- **URL Parameter Configuration**: Easy setup via query parameters
- **Environment Presets**: Quick switching between dev/staging/prod environments
- **Dynamic Configuration Display**: Real-time config visualization

## 🛠️ How to Use

### 1. Open the Example
Navigate to the example in your browser:
```
https://videoengager.github.io/examples/videoengager-core-external-commands/index.html
```

### 2. Configuration Options

#### Option A: Use Default Configuration
The example works out-of-the-box with pre-configured settings.

#### Option B: Configure via URL Parameters
Override any setting using URL parameters:
```
?tenantId=YOUR_TENANT&environment=mypurecloud.com&deploymentId=YOUR_DEPLOYMENT_ID&customerName=John%20Doe&customerEmail=john@example.com
```

#### Option C: Use Environment Presets
Quick environment switching:
```
?env=dev          # Development environment
?env=prod         # Production environment
?env=staging      # Staging environment
?env=prod-staging # Production with staging features
?env=prod-dev     # Production with dev features
```

### 3. Basic Usage Flow

1. **Initialize**: Click "Initialize VideoEngager" to set up the widget
2. **Start Video**: Click "Start Video Call" to begin a session
3. **Use Controls**: Interact with video controls (mute, camera, screen share)
4. **Monitor Events**: Watch real-time status updates in the UI
5. **End Session**: Click "End Video Call" to terminate

## 📋 Available URL Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `tenantId` | VideoEngager tenant identifier | `demo` |
| `veEnv` | VideoEngager environment | `staging.leadsecure.com` |
| `veHttps` | Use HTTPS for VideoEngager | `true` |
| `environment` | Genesys Cloud environment | `mypurecloud.com` |
| `deploymentId` | Genesys deployment ID | `your-deployment-id` |
| `customerName` | Customer display name | `John Doe` |
| `customerEmail` | Customer email address | `john@example.com` |
| `department` | Target department/queue | `support` |
| `debug` | Enable debug logging | `true` |

## 🎮 Interactive Elements

### Status Indicators
- **🟢 Green**: Active/Connected state
- **🔴 Red**: Error state
- **⚪ Gray**: Inactive/Disconnected state

### Video Action Buttons
- **🎤 Microphone**: Toggle mute/unmute
- **📹 Camera**: Toggle video on/off
- **🖥️ Screen Share**: Start/stop screen sharing
- **🔄 Camera Switch**: Switch between front/back camera (mobile)

### Real-time State Tracking
The example tracks and displays:
- Initialization status
- Video call state (active/inactive)
- Chat session state
- Individual control states (muted, camera off, etc.)

## 🔧 Technical Implementation

### Core Components

#### VideoEngager Core Instance
```javascript
videoEngagerInstance = new window.VideoEngager.VideoEngagerCore({
    tenantId: config.tenantId,
    veEnv: config.veEnv,
    veHttps: config.veHttps,
    enableVeIframeCommands: true  // Essential for external actions
});
```

#### Genesys Integration
```javascript
genesysIntegration = new window.VideoEngager.GenesysIntegrationPureSocket({
    environment: config.environment,
    deploymentId: config.deploymentId,
    debug: config.debug
});
```

#### External Action Execution
```javascript
// Execute any video function from outside the iframe
await videoEngagerInstance.executeVideoCallFn('triggerMuteUnmute');
await videoEngagerInstance.executeVideoCallFn('triggerShowHideVideo');
await videoEngagerInstance.executeVideoCallFn('triggerScreenShare');
```

#### Event Listening
```javascript
// Listen to video state changes
videoEngagerInstance.on('videoEngager:iframe-video-state-changed', (state) => {
    updateVideoState(state);
});

// Monitor video session lifecycle
videoEngagerInstance.on('videoEngager:active-ve-instance', (hasActiveInstance) => {
    // Update UI based on session state
});
```

### Key API Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `executeVideoCallFn()` | Execute video widget functions | `triggerMuteUnmute`, `triggerShowHideVideo` |
| `startVideoChatSession()` | Initiate video call | Start customer video interaction |
| `endVideoChatSession()` | End video call | Terminate current session |
| `setUiCallbacks()` | Configure iframe management | Handle iframe creation/destruction |
| `on()` / `off()` | Event management | Listen to widget events |

## 📚 Learning Outcomes

After exploring this example, you'll understand:

1. **External Control Architecture**: How to control video widget features from your application
2. **Event-Driven Integration**: Building responsive UIs that react to video widget events
3. **State Management**: Tracking and synchronizing video call state across components
4. **Configuration Management**: Flexible setup and environment management
5. **Genesys Integration**: Direct connection to Genesys Cloud services
6. **UI Callback System**: Managing iframe lifecycle and visibility

## 🔍 Advanced Features

### Debug Capabilities
- Browser console access to widget instances
- Real-time configuration inspection
- Event logging and monitoring

### Browser Compatibility
- Modern browser support with WebRTC capabilities
- Mobile-responsive design
- Cross-platform video functionality

### Production Considerations
- CDN script loading (commented example included)
- Environment-specific configurations
- Error handling and recovery

## 📞 Use Cases

This pattern is ideal for:
- **Custom Dashboards**: Integrate video controls into existing interfaces
- **Kiosk Applications**: Create self-service video support stations
- **Mobile Applications**: Add video calling to mobile web apps

## 🛡️ Security Notes

- All configurations support environment-specific deployments
- Debug mode should be disabled in production
- Tenant IDs and deployment IDs should be properly secured

---

**💡 Tip**: Use your browser's developer console to inspect the global `videoEngagerInstance` and `genesysIntegration` objects for advanced debugging and exploration.