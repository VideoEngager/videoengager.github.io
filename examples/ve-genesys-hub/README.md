# VideoEngager Widget Hub for Genesys

A powerful integration hub that connects VideoEngager's video chat capabilities with Genesys Cloud messaging.

## Overview

VideoEngager Widget Hub provides a seamless way to add video and chat communication capabilities to your web applications. It integrates with Genesys Cloud to provide a unified communication experience.
*  **Note**: Please refer to VideoEngager Support for the correct configuration of you Genesys Messenger Deployment, failing to do so will result in the widget not working as expected.


## Installation

### Browser Usage (UMD)

Add the following script tag to your HTML:

```html
  <script>
(function(g,s,c,d,q){
  q=[];g.__VideoEngagerQueue=q;g.__VideoEngagerConfigs=c;g.VideoEngager=new Proxy({},{ get:(_,m)=>(...a)=>new Promise((r,rj)=>q.push({m,a,r,rj}))});
  d=document.createElement("script");d.async=1;d.src=s;d.charset="utf-8";document.head.appendChild(d);
})(window,"https://cdn.videoengager.com/widget/latest/browser/genesys-hub.umd.js",{
    // Configure and initialize the widget
  videoEngager: {
    // VideoEngager configurations
    tenantId: 'YOUR_TENANT_ID',
    veEnv: 'staging.leadsecure.com', // e.g., 'videome.leadsecure.com'
  },
  genesys: {
    // Genesys configurations
    deploymentId: 'YOUR_DEPLOYMENT_ID',
    environment: 'YOUR_ENVIRONMENT', // e.g., 'us-east-1'
    // or domain: 'mypurecloud.com',
  },
  useGenesysMessengerChat: true // must be set to true if using methods startGenesysChat and endGenesysChat
});
</script>
```

Alternatively, you can load the script without configuration and initialize it manually:

```html
<script src="https://cdn.videoengager.com/widget/latest/browser/genesys-hub.umd.js"></script>
<script>
  // Initialize the widget after the script is loaded
  VideoEngager.initialize({
    // ... your configurations here ...
  });
</script>
```

## Usage

### Starting a Genesys Chat Session

```javascript
// Browser
VideoEngager.startGenesysChat(); // Returns a promise that resolves when the chat is started

```

### Ending a Genesys Chat Session

```javascript
// Browser
VideoEngager.endGenesysChat(); // Returns a promise that resolves when the chat is ended

```

### Starting a VideoEngager Video Session

```javascript
// Browser
VideoEngager.startVideoChatSession(); // Returns a promise that resolves when the video session is started

```

### Ending a VideoEngager Video Session

```javascript
// Browser
VideoEngager.endVideoChatSession(); // Returns a promise that resolves when the video session is ended

```

### Setting Custom Attributes

You can set custom attributes that will be passed to both Genesys and VideoEngager:

```javascript
// Browser
VideoEngager.setCustomAttributes({
  'context.firstName': 'someName',
  'context.lastName': 'someLastName',
  product: 'premium',
  source: 'homepage'
}); // Returns a promise that resolves when the attributes are set

```

## Checking If the Widget Is Ready and initialized

You can check if the VideoEngager widget is ready and initialized in two ways:

### Using a Callback

```javascript
// Browser
VideoEngager.onReady(function() {
  console.log('VideoEngager is ready!');
  // Safe to use other methods now
});

```

### Using Promises (async/await)

```javascript
// Browser
async function initializeApp() {
  await VideoEngager.waitForReady();
  console.log('VideoEngager is ready!');
  // Safe to use other methods now
}

```

## Configuration Options

The widget accepts the following configuration options:

### Required Options

- `videoEngager`: VideoEngager connection configurations
  - `tenantId`: Your VideoEngager tenant ID
  - `veEnv`: VideoEngager service domain (e.g., 'videome.leadsecure.com')
  - `veHttps`: Boolean indicating whether to use HTTPS (default: true)
  - `isPopup`: Boolean indicating whether to use the widget in a popup (default: false)
- `genesys`: Genesys connection configurations
  - `deploymentId`: Your Genesys deployment ID
  - And either:
    - `environment`: Genesys environment (e.g., 'us-east-1', 'eu-west-1'), OR
    - `domain`: Genesys domain (e.g., 'mypurecloud.com', 'mypurecloud.ie')
  - `hideGenesysLauncher`: Boolean indicating whether to hide the Genesys launcher (default: false)

## Listen for Events
You can listen for events emitted by the widget using the following methods:
    
    ```javascript
    // Browser
    VideoEngager.on('eventName', (data) => {
      console.log('Event received:', eventName, data);
    }); // Return a promise that resolves to function to unsubscribe from the event
    ```
## Unsubscribing from Events
You can unsubscribe from events using the following method:

```javascript
// Browser
VideoEngager.off('eventName', callback); // Unsubscribes from the specified event
// or via the returned function from the on method
```
## Available Events
- `GenesysMessenger.opened`: Emitted when the Genesys Messenger UI is opened
- `GenesysMessenger.closed`: Emitted when the Genesys Messenger UI is closed
- `GenesysMessenger.conversationStarted`: Triggered when a Genesys conversation is started from the Genesys JS SDK
- `GenesysMessenger.conversationEnded`: Triggered when a Genesys conversation is ended from the Genesys JS SDK
- `VideoEngagerCall.started`: Fired when a VideoEngager call is started and the widget is loaded in the UI
- `VideoEngagerCall.ended`: Fired when a VideoEngager call is ended and the widget is removed from the UI
- `VideoEngagerCall.agentJoined`: Fired when an agent joins the call in an active VideoEngager session (can be triggered multiple times due to reconnects)

### Optional Options

- `useGenesysMessengerChat`: Boolean indicating whether to use Genesys Messenger for chat (default: false)
- `ui`: UI configuration options
  - `useVeLauncherButtons`: Boolean indicating whether to use VideoEngager launcher buttons (default: false)
  - `useVeForm`: Boolean indicating whether to use VideoEngager form (default: false)
  - `form`: Form configuration array of objects, with each object representing a form field
    - `name`: Name of the form field (must be unique within the form, used as key in form data)
    - `label`: Label text for the form field
    - `type`: Type of the form field:
      - `'text'`: Text input
      - `'email'`: Email input
      - `'phone'`: Phone number input
      - `'number'`: Numeric input
      - `'textarea'`: Multi-line text input
      - `'select'`: Dropdown selection
      - `'checkbox'`: Checkbox input
    - `required`: Boolean indicating whether the field is required (default: false)
    - `placeholder`: Placeholder text for input fields (for text, email, phone, number, textarea)
    - `defaultValue`: Default value for the field (string/number for inputs, string for select, boolean for checkbox)
    - `options`: Array of string options (required for select type)
    - `helpText`: Help text shown below the field
    - `validationFn`: Custom validation function (optional)
    - `htmlRegex`: HTML regex pattern for validation (works with text, email, phone, number)

  - `customAttributes`: Custom attributes to pass to Genesys and VideoEngager
