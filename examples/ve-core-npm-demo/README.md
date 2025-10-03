# Live Demo

### Url: https://videoengager.github.io/examples/ve-core-npm-demo/dist/index.html

# VideoEngager React Demo Application

A React-based demonstration application for integrating VideoEngager's video chat capabilities with Genesys Cloud contact center platform. This application showcases various integration patterns including inline/popup video sessions with minimal chat UI implementation and functionality.

## Overview

This demo application provides a command center interface for testing and demonstrating VideoEngager video chat sessions integrated with Genesys Cloud. It supports multiple configuration presets and allows customization of context attributes that are passed to video sessions.

## Features

- **Multiple Integration Modes**
  - Inline video with chat
  - Popup video with chat
  - Inline video without chat
  - Popup video without chat

- **Preset Configurations**
  - Two deployment environments (standard and US West)
  - Pre-configured tenant and deployment settings
  - Industry-specific context presets (Travel, Banking, Healthcare, Telecom)

- **Video Controls**
  - Camera toggle
  - Microphone mute/unmute
  - Camera switching
  - Screen sharing
  - Call end functionality

- **Chat Interface**
  - Real-time messaging with agents
  - Message history display
  - Timestamp formatting

- **Context Management**
  - Customizable customer context attributes
  - Industry-specific preset templates
  - JSON preview of context data

## Getting Started

### Prerequisites

- Node.js (v20.19 or higher recommended)
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/VideoEngager/videoengager.github.io.git

# Navigate to project directory
cd ./videoengager.github.io/examples/ve-core-npm-demo

# Install dependencies
npm install
```

### Running the Application

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:5173` (or the port specified by Vite).

## Usage

### Basic Workflow

1. **Select Configuration Preset**
   - Choose from the dropdown menu (e.g., `inlineWithChat`, `popupWithChat_usaw`)
   - Each preset includes VideoEngager and Genesys deployment configurations

2. **Configure Context Attributes**
   - Select an industry preset (Travel, Banking, Healthcare, Telecom, or Custom)
   - Modify customer information, case details, and session attributes as needed
   - Preview the JSON representation of your context

3. **Confirm Configuration**
   - Click "Confirm Config" to lock in your settings
   - This generates a unique session URL with encoded configuration

4. **Launch Video Session**
   - **Launch iFrame**: Embeds the video session within the current page
   - **Launch Popup**: Opens the video session in a new popup window

5. **Start Video Session**
   - Click "Start" button when ready to initiate the video chat
   - Accept browser permissions for camera and microphone when prompted

6. **During the Session**
   - Use video controls to manage camera, microphone, and screen sharing
   - Send and receive chat messages
   - End the call when finished

### Context Attributes

The following context attributes can be customized:

- **firstName**: Customer name
- **emailAddress**: Customer email
- **phoneNumber**: Customer phone number
- **sessionId**: Unique session identifier
- **customerId**: Customer account identifier
- **caseId**: Support case reference
- **productSKU**: Product or service identifier
- **deviceModel**: Device information
- **priority**: Case priority (low, normal, high)
- **locale**: Language and region code
- **consentFlag**: Customer consent status
- **notes**: Additional context or notes for agents

## Project Structure

```
src/
├── App.tsx                          # Main application router
├── Index.tsx                        # Command center page
├── Single.tsx                       # Video session page
├── components/
│   ├── Chat.tsx                     # Chat interface component
│   ├── ChatAndVideoContainer.tsx    # Layout container
│   ├── CommandButtons.tsx           # Configuration controls
│   ├── ContextMenu.tsx              # Context attribute editor
│   ├── Video.tsx                    # Video container component
│   └── VideoControls.tsx            # Video control buttons
└── utils/
    └── ConfigManager.ts             # Configuration management utility
```

## Configuration Presets

### Standard Environment
- **Tenant ID**: `0FphTk091nt7G1W7`
- **Environment**: `videome.leadsecure.com`
- **Deployment ID**: `c5d801ae-639d-4e5e-a52f-4963342fa0dc`
- **Domain**: `mypurecloud.com`

### US West Environment
- **Tenant ID**: `yRunQK8mL7HsJidu`
- **Environment**: `videome.leadsecure.com`
- **Deployment ID**: `efc4abdb-4c95-4f5d-86b8-b6fb6b3e5b9b`
- **Domain**: `usw2.pure.cloud`

## Technologies Used

- **React 19** with TypeScript
- **React Router** for navigation
- **VideoEngager Core Widget JS** for video integration
- **Genesys Integration** for contact center connectivity
- **Font Awesome** for icons
- **Vite** for build tooling

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

Ensure browser permissions for camera, microphone, and popups are enabled.

## Troubleshooting

- **Popup Blocked**: Enable popups for this site in your browser settings
- **Camera/Microphone Access**: Check browser permissions and ensure no other applications are using the devices
- **Connection Issues**: Verify network connectivity and firewall settings
- **Session Not Starting**: Check console logs for configuration errors


## URL Parameter Overrides

All configuration parameters can be overridden via URL query parameters, allowing you to customize the setup without modifying the preset configurations:

### Parameter Mapping

```javascript
const URL_PARAMETER_MAP = {
  genesysDeploymentId: 'genesys.deploymentId',    // Genesys Cloud deployment identifier
  genesysDomain: 'genesys.domain',                // Genesys Cloud region domain
  veTenantId: 'videoEngager.tenantId',            // VideoEngager tenant identifier
  veEnv: 'videoEngager.veEnv',                    // VideoEngager environment endpoint
  interactive: 'useGenesysMessengerChat',         // Enable/disable chat integration
  debug: 'debug',                                 // Enable debug mode
  isPopup: 'videoEngager.isPopup',                // Display mode (popup vs inline)
};
```

### Override Examples

#### Complete Custom Configuration

You can override all parameters to create an entirely new configuration. This example demonstrates a complete custom setup for the Australia region with a test tenant:

```
https://videoengager.github.io/examples/ve-core-npm-demo/dist/index.html?genesysDeploymentId=YOUR_GENESYS_DEPLOYMENT_ID&genesysDomain=YOUR_GENESYS_DOMAIN&veTenantId=YOUR_VE_TENANT_ID&veEnv=YOUR_VE_ENVIRONMENT
```

## License

This project is licensed under the MIT License. See [LICENSE.md](LICENSE.md) for details.

### Getting Help

- **Issues**: [Video Engager Helpdesk](https://help.videoengager.com/hc/en-us/requests/new)
- **Dev Documentation**: [VideoEngager Docs](https://videoengager.github.io/videoengager.widget/#/core/README)
- **User Documentation**: [VideoEngager Helpdesk](https://help.videoengager.com/)


For enterprise support and custom integrations, contact VideoEngager Support <a href="mailto:support@videoengager.com">support@videoengager.com</a> directly.