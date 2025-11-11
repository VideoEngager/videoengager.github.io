# VideoEngager Agent SDK - React Integration

## Overview

This project demonstrates an integration of the VideoEngager Agent SDK in a React application. The implementation provides a clean, type-safe interface for video calling capabilities with support for agent authentication and session management.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety and enhanced developer experience
- **Vite** - Fast build tool and development server
- **VideoEngager Agent SDK** - Enterprise video calling solution

## Getting Started

### Prerequisites

- Node.js (v20.x or higher recommended)
- npm or yarn package manager

### Run the project

1. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## VideoEngager SDK Integration

### Setup Approach

The integration follows a **user-driven initialization pattern** where the SDK is initialized only after the agent provides their email credentials. This approach was chosen for several key reasons:

#### Why This Pattern?

1. **Security First**: Prevents automatic initialization with hardcoded credentials, ensuring each agent authenticates with their own email.

2. **Flexibility**: Allows different agents to use the same application instance without requiring code changes or environment variables.

3. **Error Prevention**: Avoids React StrictMode double-mounting issues by controlling when initialization occurs through user interaction.

4. **Better UX**: Provides clear visual feedback about the SDK state (uninitialized vs ready) and prevents premature API calls.

### Architecture Decisions

#### Generic Authentication Method
The implementation uses VideoEngager's `generic` authentication method with an API key (PAK). This provides a balance between security and ease of integration for agent-facing applications.

#### React State Management
The SDK is integrated using React hooks and state management rather than auto-initialization to ensure:
- Proper cleanup on component unmount
- Controlled initialization lifecycle
- Prevention of duplicate initialization attempts

#### Custom UI Handlers
Instead of using the default SDK widget rendering, custom UI handlers were implemented to:
- Maintain full control over iframe positioning and styling
- Ensure compatibility with React's virtual DOM
- Prevent DOM manipulation conflicts during re-renders

## Project Structure

```
src/
├── App.tsx              # Main application component
├── VideoEngager.tsx     # VideoEngager SDK integration component
├── main.tsx            # Application entry point
└── vite-env.d.ts       # TypeScript declarations
```

## Key Features

- **Agent Email Input**: Secure agent authentication before SDK initialization
- **Session Management**: Real-time session state tracking and event handling
- **Call Controls**: Start call, start call with customer ID, and end call functionality
- **Status Display**: Visual feedback for call status, visitor ID, and session state
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **TypeScript Support**: Full type safety for SDK methods and callbacks

### Parameter Mapping

```javascript
const URL_PARAMETER_MAP = {
  apiKey: 'your PAK',                              // Partner access key
  domain: 'videome.leadsecure.com',                // VideoEngager environment endpoint
  agentEmail: 'example@agent.com',                 // Agent email
  organizationId: 'your-organization-id',          // Your organization id
};
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Event Handling

The application listens to the following VideoEngager SDK events:

- `sessionStarted` - Triggered when a video session begins
- `sessionEnded` - Triggered when a video session ends
- `sessionFailed` - Triggered when a session fails to start
- `callStateUpdated` - Triggered on any call state change

## Browser Support

The application supports all modern browsers with WebRTC capabilities:
- Chrome/Edge (recommended)
- Firefox
- Safari

Requires camera and microphone permissions for video calling.

## License

This project is licensed under the MIT License. See [LICENSE.md](LICENSE.md) for details.

## Support

For VideoEngager SDK documentation and support, visit:
- [VideoEngager Agent SDK on npm](https://www.npmjs.com/package/videoengager-agent-sdk)
- [VideoEngager Documentation](https://www.videoengager.com)
