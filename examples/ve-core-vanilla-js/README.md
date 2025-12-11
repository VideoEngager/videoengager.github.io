# Live Demo

### Url: https://videoengager.github.io/examples/ve-core-vanilla-js/index.html

# VideoEngager Vanilla JavaScript Demo Application

A pure vanilla JavaScript demonstration application for integrating VideoEngager's video chat capabilities with Genesys Cloud contact center platform. This application showcases a complete customer service workflow from service selection through live video interaction with agents, all without relying on any frontend frameworks.

## Overview

This demo application provides a "Virtual Branch" interface that simulates a government or service center where customers can select services, provide their information, and initiate video chat sessions with agents. It demonstrates how to integrate VideoEngager and Genesys Cloud using plain JavaScript, HTML, and CSS.

## Features

- **Multi-Page Flow**
  - Service selection landing page
  - Beneficiary information form
  - Live video interaction page with integrated chat

- **Service Categories**
  - Pension Services
  - Civil Registry
  - Subsidies and Benefits
  - Healthcare
  - General Inquiries

- **VideoEngager Integration**
  - VideoEngager Core Widget JS integration
  - Dynamic iframe creation and management
  - Video session lifecycle management
  - Custom UI callbacks

- **Genesys Cloud Integration**
  - Genesys Messenger integration
  - Custom attribute passing
  - Session state management
  - Unified chat and video experience

- **User Experience**
  - Loading states and error handling
  - Responsive layout for video and chat
  - Session data persistence using sessionStorage
  - URL parameter configuration

- **State Management**
  - Session-based data storage
  - Service and beneficiary information tracking

But of course you can adjust everything as of your needs

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A web server to serve static files (development server, Apache, nginx, etc.)
- Valid VideoEngager tenant credentials
- Valid Genesys Cloud deployment credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/VideoEngager/videoengager.github.io.git

# Navigate to project directory
cd ./videoengager.github.io/examples/ve-core-vanilla-js

# Serve the files using any static file server
# For example, using Python's built-in server:
python -m http.server 8000

# Or using Node.js http-server:
npx http-server -p 8000

# Or using PHP's built-in server:
php -S localhost:8000
```

The application will be available at `http://localhost:8000` (or your specified port).

## Usage

### Basic Workflow

1. **Access the Application**
   - Navigate to the application URL with required query parameters:
   ```
   index.html?genesysDeploymentId=YOUR_DEPLOYMENT_ID&genesysDomain=YOUR_DOMAIN&veTenantId=YOUR_TENANT_ID&veDomain=YOUR_VE_DOMAIN
   ```

2. **Select a Service**
   - Choose from available service categories (Pension, Civil Registry, Healthcare, etc.)
   - Click "Request Assistance" on the desired service card

3. **Provide Information**
   - Enter your full name (required)
   - Enter your email address (required)
   - Click "Request Video Call" to proceed

4. **Video Session**
   - Wait for the system to establish connection
   - The video interface will load in an iframe
   - Chat functionality appears alongside the video
   - Use the video controls within the iframe to manage your session

5. **End Session**
   - End the video call through the video interface
   - The session data will be cleared when you navigate away

### URL Parameters Configuration

The application uses URL query parameters for configuration. This allows you to deploy the same code across different environments without code changes.

| Parameter | Description | Required | Default Value | Example |
|-----------|-------------|----------|---------------|---------|
| `genesysDeploymentId` | Genesys Cloud deployment identifier. This is your unique deployment ID from Genesys Cloud admin panel. | **Yes** | N/A | `c5d801ae-639d-4e5e-a52f-4963342fa0dc` |
| `genesysDomain` | Genesys Cloud region domain. Specifies which Genesys Cloud region your organization uses. | No | `mypurecloud.com` | `mypurecloud.com`<br>`usw2.pure.cloud`<br>`mypurecloud.ie`<br>`mypurecloud.de` |
| `veTenantId` | VideoEngager tenant identifier. Your unique tenant ID provided by VideoEngager. | **Yes** | N/A | `0FphTk091nt7G1W7` |
| `veDomain` | VideoEngager environment endpoint. The VideoEngager server domain for your region or environment. | No | `videome.leadsecure.com` | `videome.leadsecure.com`<br>`videome.videoengager.eu` |

**Notes:**
- Required parameters (marked as **Yes**) must be provided or the application will show an error
- Optional parameters will use their default values if not specified
- All parameters are preserved across page navigation within the application
- Parameters are case-sensitive

### Example URL

```
https://videoengager.github.io/examples/ve-core-vanilla-js/index.html?genesysDeploymentId=c5d801ae-639d-4e5e-a52f-4963342fa0dc&genesysDomain=mypurecloud.com&veTenantId=0FphTk091nt7G1W7&veDomain=videome.leadsecure.com
```

## Project Structure

```
ve-core-vanilla-js/
├── index.html                # Service selection page
├── form.html                 # Beneficiary information form
├── interaction.html          # Video session page
├── css/
│   └── styles.css           # Application styles
└── js/
    ├── config.js            # Configuration parsing and validation
    ├── service-selection.js # Service selection logic
    ├── form.js              # Form handling logic
    ├── interaction.js       # Video session management
    └── utils.js             # Shared utility functions
```

## Architecture

### Data Flow

1. **Service Selection** ([index.html](index.html))
   - User selects a service
   - Service ID and name stored in sessionStorage
   - Navigates to form.html with URL parameters preserved

2. **Information Collection** ([form.html](form.html))
   - User provides name and email
   - Data validated and stored in sessionStorage
   - Navigates to interaction.html with URL parameters preserved

3. **Video Interaction** ([interaction.html](interaction.html))
   - Configuration loaded from URL parameters
   - Request data retrieved from sessionStorage
   - VideoEngager and Genesys instances initialized
   - Custom attributes formatted and passed to Genesys
   - Video session started with chat integration

### Key Components

#### Configuration Management ([js/config.js](js/config.js))
- Parses URL parameters
- Validates required configuration
- Builds configuration objects for VideoEngager and Genesys

#### Utility Functions ([js/utils.js](js/utils.js))
- `createIframe()`: Creates VideoEngager iframe dynamically
- `storeData()` / `retrieveData()`: SessionStorage helpers
- `formatCustomAttributes()`: Formats context data for Genesys
- `buildUrlWithParams()`: Preserves URL parameters across navigation

#### VideoEngager Integration ([js/interaction.js](js/interaction.js))
- Initializes VideoEngager Core Widget
- Sets up Genesys integration
- Manages session lifecycle
- Handles UI callbacks for iframe management
- Implements error handling

## Custom Attributes Passed to Genesys

The application passes the following custom attributes to Genesys agents:

- **context.procedureId**: Service identifier (e.g., `TRAM_PREV_001`)
- **context.procedureName**: Service name (e.g., `Pension Services`)
- **context.firstName**: Customer name
- **context.email**: Customer email address
- **context.requestTimestamp**: ISO timestamp of request

These attributes are visible to agents in the Genesys interface, providing context about the customer's needs.

## Technologies Used

- **Pure Vanilla JavaScript** (ES6+)
- **HTML5** and **CSS3**
- **VideoEngager Core Widget JS** (v5.0.0) for video integration
- **Genesys Cloud Platform SDK** for contact center connectivity
- **SessionStorage API** for state management

## Browser Support

- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

Ensure browser permissions for camera, microphone, and popups are enabled.

## Troubleshooting

### Configuration Issues

- **Missing Parameters Error**: Ensure all required URL parameters are provided
  - Check that `genesysDeploymentId`, `genesysDomain`, `veTenantId` are present
  - Verify parameter values are correct

### Connection Issues

- **"Connection Error" Screen**:
  - Verify network connectivity
  - Check firewall settings
  - Ensure VideoEngager and Genesys services are accessible
  - Review browser console for detailed error messages

### Session Issues

- **"Request data not found" Error**:
  - This occurs when navigating directly to interaction.html
  - Always start from index.html and follow the complete flow
  - Ensure sessionStorage is enabled in your browser

### Browser Issues

- **Camera/Microphone Access**: Check browser permissions and ensure no other applications are using the devices
- **Iframe Not Loading**: Check browser console for CORS or CSP errors
- **Chat Not Appearing**: Verify Genesys deployment configuration is correct

## Development Notes

### Adding New Services

To add new service categories, edit [index.html](index.html) and add new service cards:

```html
<div class="service-card"
     data-service-id="YOUR_SERVICE_ID"
     data-service-name="Your Service Name">
  <div class="service-icon">🔧</div>
  <h3>Your Service Name</h3>
  <p>Service description</p>
  <button class="btn-select">Request Assistance</button>
</div>
```

### Customizing Form Fields

To add additional beneficiary information fields, edit [form.html](form.html) and update the form handling in [js/form.js](js/form.js).

### Extending Custom Attributes

To pass additional context to Genesys agents, modify the `formatCustomAttributes()` function in [js/utils.js](js/utils.js):

```javascript
function formatCustomAttributes(requestData) {
    return {
        "context.procedureId": requestData.service.id,
        "context.procedureName": requestData.service.name,
        "context.firstName": requestData.beneficiary.name,
        "context.email": requestData.beneficiary.email,
        "context.requestTimestamp": new Date().toISOString(),
        // Add your custom attributes here
        "context.customField": "your value"
    };
}
```

## URL Parameter Configuration

All configuration is managed via URL parameters. This allows you to:

- Deploy the same code for different environments
- Create bookmarkable configurations
- Test with different tenant/deployment combinations
- Share working configurations easily

### Parameter Reference

| Parameter | Description | Required | Example |
|-----------|-------------|----------|---------|
| `genesysDeploymentId` | Genesys Cloud deployment identifier | Yes | `c5d801ae-639d-4e5e-a52f-4963342fa0dc` |
| `genesysDomain` | Genesys Cloud region domain | No* | `mypurecloud.com` |
| `veTenantId` | VideoEngager tenant identifier | Yes | `0FphTk091nt7G1W7` |
| `veDomain` | VideoEngager environment endpoint | No* | `videome.leadsecure.com` |

\* Defaults to shown example values if not provided

## Security Considerations

- Tenant IDs and deployment IDs are considered public information in this demo
- In production, consider implementing authentication before video sessions
- Validate and sanitize all user input on the server side
- Use HTTPS in production environments
- Implement rate limiting for API calls
- Consider adding CAPTCHA for form submissions

## Performance Optimization

- VideoEngager SDK is loaded via CDN for optimal caching
- Minimal dependencies keep the bundle size small
- SessionStorage used for efficient client-side state management
- Iframe lazy-loaded only when needed

## License

This project is licensed under the MIT License. See [LICENSE.md](LICENSE.md) for details.

## Getting Help

- **Issues**: [Video Engager Helpdesk](https://help.videoengager.com/hc/en-us/requests/new)
- **Dev Documentation**: [VideoEngager Docs](https://videoengager.github.io/videoengager.widget/#/core/README)
- **User Documentation**: [VideoEngager Helpdesk](https://help.videoengager.com/)
- **Source Code**: [GitHub Repository](https://github.com/VideoEngager/videoengager.github.io/tree/master/examples/ve-core-vanilla-js)

For enterprise support and custom integrations, contact VideoEngager Support at <a href="mailto:contact@videoengager.com">contact@videoengager.com</a> directly.

## Related Examples

- [VideoEngager React Demo](../ve-core-npm-demo/) - React-based implementation with similar functionality
- [VideoEngager Widget Examples](../../) - Additional integration patterns and use cases
