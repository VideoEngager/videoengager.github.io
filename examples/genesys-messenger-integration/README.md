# VideoEngager Widget with Genesys Messenger JS SDK Integration

This code integrates VideoEngager's video capabilities with the Genesys Messenger JavaScript SDK for web applications. The video functionality is initiated via a separate button. When a video session is initiated, it is seamlessly integrated with the Genesys chat, allowing for synchronized video and messaging interactions within the Genesys Cloud platform. This setup provides a flexible and customizable experience for web-based customer interactions.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
    - [Manual Setup](#manual-setup)
    - [Tampermonkey Setup](#tampermonkey-setup)
  - [Usage](#usage)
- [Implementation Details](#implementation-details)
  - [Initialization Process](#initialization-process)
  - [Video Session Management](#video-session-management)
  - [Responsive Design and Interactivity](#responsive-design-and-interactivity)
  - [Error Handling and Debugging](#error-handling-and-debugging)
- [How to Use with Tampermonkey](#how-to-use-with-tampermonkey)
- [To Do / Roadmap](#to-do--roadmap)
- [License](#license)

## Features

- **Seamless Genesys Integration**: Connects directly to Genesys Messenger and manages video sessions within the platform.
- **Rich Customization**: Offers customizable attributes, environment settings, and control over UI behavior.
- **Responsive UI**: Automatically adjusts to different screen sizes, including full-screen mode on mobile devices.
- **Interactive Window Management**: Supports draggable, resizable, and minimizable windows, providing users with flexibility.
- **Event-Driven Architecture**: Listens and reacts to a variety of events from both the UI and Genesys services.

## Getting Started

### Prerequisites

- Active Purecloud account with the necessary Messenger deploymentId and [other details](https://developer.genesys.cloud/commdigital/digital/webmessaging/messengersdk/genesysgf#single-snippet).
- Tampermonkey or an equivalent userscript manager for simplified script deployment.

### Installation

#### Manual Setup

1. Clone this repository.
2. Include the JavaScript file in your web project.
3. Initialize the widget using the provided configuration options.

#### Tampermonkey Setup

1. Install the [Tampermonkey extension](https://www.tampermonkey.net/) in your browser.
2. Create a new script in Tampermonkey, paste the provided JavaScript code, and save it.

### Usage

To initialize the Video Engager Widget, you must configure it with your Genesys environment:

```javascript
const videoEngagerInstance = VideoEngagerWidget.initializeVeGensysMessaging({
  TENANT_ID: 'your_tenant_id', // VideoEngager tenant ID
  veUrl: 'https://your_ve_url', // VideoEngager service URL
  environment: 'your_environment', // Genesys environment name
  deploymentId: 'your_deployment_id', // Genesys Messenger deployment ID
  envUrl: 'your_env_url', //purecloud environment url eg: https://apps.mypurecloud.com
  customAttributes: {},  // Optional: Custom session attributes
  autoAccept: true,      // Optional: Automatically accept video calls
  debug: false           // Optional: Enable debug mode for logging
});
```

## Implementation Details

### Initialization Process

The widget's initialization is handled by the static method `initializeVeGensysMessaging`. This method performs the following key operations:

1. **Loading Genesys Messenger**: The `loadGenesysWidget` function dynamically injects the Genesys Messenger script into the webpage. It uses the provided environment URL to ensure the correct deployment and configuration are used.

2. **Widget Instance Creation**: After loading the Genesys Messenger, a new instance of `VideoEngagerWidget` is created. The constructor initializes various internal properties, including:
   - `TENANT_ID`: Identifier for the tenant in the VideoEngager platform.
   - `veUrl`: URL for the VideoEngager service.
   - `customAttributes`: Optional custom attributes that can be passed to the Genesys session.
   - `autoAccept`: Boolean flag indicating whether incoming video calls should be auto-accepted.

3. **UI Injection**: The constructor calls helper functions `injectStyles` and `safelyInjectHtml` to inject the necessary styles and HTML elements into the DOM. These functions set up the basic UI elements, such as the launcher button, movable window, and action buttons (minimize, resize, end).

4. **Event Listeners**: Event listeners are registered for both UI interactions and Genesys events:
   - **UI Events**: Handlers are set up for the launcher button, end button, and minimize button to control the video session.
   - **Window Events**: Listeners for `beforeunload` and `message` events are registered to manage session cleanup and communication with the Genesys Messenger.
   - **Genesys Events**: Subscriptions to Genesys Messenger events like `Launcher.ready`, `MessagingService.conversationDisconnected`, and `GenesysVendors.ready` are established to react to state changes in the Genesys environment.

### Video Session Management

- **Starting a Video Session**: The method `startGenesysVideoSession` is the entry point for initiating a video call. It first checks if a call is already ongoing (`isCallOngoing`). If not, it prepares the interaction ID using `prepareVideoCall`, ensures the Genesys Messenger is ready, and sends a message to start the video session (`sendStartVideoSessionMessage`). The video session is displayed in an iframe embedded within the widget's movable window.

- **Stopping a Video Session**: The method `stopGenesysVideoSession` handles the termination of an ongoing video call. It sends a command to update the Genesys database, indicating that the video session has ended, and optionally notifies the agent. The iframe is then removed, and the widget UI is reset.

- **UI Controls**: The video widget offers various UI controls:
   - **Launcher Button**: Initiates the video session.
   - **Minimize Button**: Hides the video widget but keeps the session active.
   - **End Button**: Terminates the video session and cleans up resources.
   - **Resize Button**: Toggles the widget between its original size and full-screen mode, with special behavior on mobile devices.

### Responsive Design and Interactivity

- **Responsive Behavior**: The video widget's UI adapts to different screen sizes, particularly on mobile devices where it automatically enters full-screen mode. This behavior is managed by the `applyResponsiveBehavior` function, which adjusts the widget's position and size based on the current screen dimensions.

- **Draggable and Resizable Window**: The widget's window is made draggable using the `interact.js` library, allowing users to move it around the screen. The window's size can also be toggled between a predefined size and full-screen mode, enhancing the user experience.

### Error Handling and Debugging

- **Error Handling**: The widget is designed to gracefully handle errors, particularly when interacting with Genesys services. The `PromiseGenesys` function wraps Genesys commands in a Promise, allowing for easy error management and retries if necessary.

- **Debug Mode**: A `debug` option is provided during initialization, which, when enabled, logs detailed information about the widget's operations and interactions with Genesys services. This feature is invaluable during development and troubleshooting.

## How to Use with Tampermonkey

1. **Install the Script**:
   - Copy the entire script provided in this repository.
   - Paste it into a new Tampermonkey script and save it.

2. **Configure Your Settings**:
   - Modify the initialization parameters (e.g., `TENANT_ID`, `veUrl`, `environment`) to match your Genesys and VideoEngager setup.
   - The script will automatically run on the pages where Tampermonkey is enabled, injecting the VideoEngager widget into your website.

3. **Running the Widget**:
   - The widget will appear as a launcher button on your website.
   - Click the launcher to start a video session or use the end button to terminate the call.


## To Do / Roadmap

- **Enhanced Error Handling**:
  - Improve error reporting and handling, particularly around network failures and Genesys API interactions.
  - Implement retry logic for failed API calls with exponential backoff.

- **Unit and Integration Testing**:
  - Develop comprehensive unit tests for core functions such as `startGenesysVideoSession`, `stopGenesysVideoSession`, and `PromiseGenesys`.
  - Implement end-to-end integration tests to ensure seamless interaction with the Genesys Messenger.

- **Advanced Customization Options**:
  - Introduce additional customization options for the widget's UI elements, such as themes, colors, and button styles.
  - Allow dynamic configuration of custom attributes at runtime without requiring a full reinitialization.

- **Performance Optimization**:
  - Optimize the widget's loading time by asynchronously loading dependencies and minimizing the number of external requests.
  - Reduce the widget's footprint by leveraging tree-shaking and other modern JavaScript optimization techniques.

- **Mobile Experience Enhancements**:
  - Refine the mobile experience by improving touch interactions, such as swipe gestures for minimizing or closing the widget.
  - Explore adding support for video call quality adjustments based on network conditions.

- **Localization and Internationalization**:
  - Add support for multiple languages within the widget.
  - Allow the widget's text and messages to be easily customized and localized.

- **Documentation and Examples**:
  - Expand the documentation to include detailed examples of various configurations and customizations.
  - Create a series of tutorials or how-to guides that demonstrate the widget's capabilities in different scenarios.

- **User Feedback and Analytics**:
  - Integrate analytics to track user interactions with the widget and gather insights for further improvements.
  - Add a feedback mechanism within the widget to collect user opinions and suggestions.


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
