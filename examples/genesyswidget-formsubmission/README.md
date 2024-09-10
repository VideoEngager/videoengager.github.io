

# VideoEngager Integration Example

This project demonstrates the integration of the VideoEngager widget with a simple HTML form. The form allows users to start either an audio or video session using Genesys' CXBus and VideoEngager. The JavaScript logic transforms form inputs, handles external library loading, and manages user interactions.

## Project Structure

- **index.html**: The main HTML page containing buttons for initiating audio or video sessions. Forms are dynamically shown and hidden based on user interaction.
- **app.js**: The JavaScript file that handles form data transformation, external library loading, and interactions with VideoEngager using CXBus.
- **config.js**: The configuration file that sets up the Genesys widgets and VideoEngager settings.

---

## Files

### 1. **index.html**
This is the main web page, containing the structure and layout for the UI. It includes two main buttons: 
- **Audio Button**: Clicking this reveals a form for audio interaction.
- **Video Button**: Clicking this reveals a form for video interaction.

After form submission, the relevant button is disabled and its color is changed until the session is completed.

#### Key Sections:
- **Audio and Video Buttons**: Users can choose between starting an audio or video session.
- **Forms**: Each form collects required information (like name, email, phone, etc.) and triggers the appropriate interaction with VideoEngager.
- **Interaction**: Once a form is submitted, the interaction with VideoEngager is handled via JavaScript.

### 2. **app.js**
This file contains the logic for handling user interactions, transforming form inputs, and integrating with the external VideoEngager library.

#### Key Features:
- **Form Data Transformation**: Form data is mapped to the required format for VideoEngager.
- **External Library Loading**: The external Genesys CXBus and VideoEngager widget libraries are loaded dynamically.
- **Session Management**: The script handles the session initiation for both audio and video interactions and listens for completion events.
- **Event Handling**: Subscriptions to various CXBus events (e.g., `WebChatService.ended`, `WebChatService.error`) ensure proper handling of interaction life cycle.

### 3. **config.js**
This file configures the Genesys widgets and VideoEngager with necessary settings.

#### Key Settings:
- **CXBus**: Sets up the CXBus and loads the required plugins.
- **VideoEngager Configuration**: Contains the settings required for VideoEngager, such as tenant ID, API keys, and UI behavior.

---

## Setup Instructions

### Prerequisites:
1. **Web Server**: You need a basic web server to serve the HTML and JavaScript files. You can use something as simple as Python's built-in server.
2. **Genesys API Access**: Ensure you have the required credentials and access to Genesys and VideoEngager services.
3. **Configuration**: Ensure the `config.js` file is properly set up with your Genesys and VideoEngager credentials and settings.

### Steps to Run the Project:

1. **Clone or Download the Project**:
   ```
   git clone https://github.com/your-repo/videoengager-integration
   cd videoengager-integration
   ```

### 2. **Configure Your Settings**

To get started, you’ll need to set up your Genesys and VideoEngager configurations in the `config.js` file. Please follow the steps below to ensure the settings are properly customized for your organization.

#### Required Fields for Tenant Setup:

Check for a detailed explanation VideoeEngager [How to obtain my Genesys Cloud Parameters, required to setup VideoEngager SDKs](https://help.videoengager.com/hc/en-us/articles/360061175891-How-to-obtain-my-Genesys-Cloud-Parameters-required-to-setup-VideoEngager-SDKs)

You must configure the following fields specific to your tenant:

- **tenantId**: Your VideoEngager Tenant ID.
- **deploymentKey**: The Widget Deployment Key from Genesys.
- **orgGuid**: The Organization ID from Genesys Cloud.
- **targetAddress**: The Queue Name for routing interactions.

#### Example Configuration:

```javascript
window._genesys.widgets = {
  videoengager: {
    tenantId: '', // VideoEngager Tenant ID. Find this in Apps > SmartVideo_Settings > Tenant ID.
  }
};

window._genesys.widgets = {
  webchat: {
    transport: {
      deploymentKey: '', // Widget Deployment Key. Find this in Genesys Cloud: Admin > Contact Center > Widgets > Deployment Key.
      orgGuid: '', // Organization ID. Find this in Genesys Cloud: Admin > Account Settings > Organization Settings > Advanced > Organization ID.
      interactionData: {
        routing: {
          targetAddress: '' // Queue Name. Enter the name of the ACD queue in Genesys Cloud.
        }
      }
    }
  }
};
```

3. **Start a Local Web Server**:
   - Using Python:
     ```
     python3 -m http.server
     ```
   - This will start a web server on `http://localhost:8000`. Open this URL in your browser.

4. **Test the Integration**:
   - Open the `index.html` file in your browser.
   - Click the **Audio** or **Video** button to reveal the form.
   - Fill out the required fields and submit the form to start an interaction using the VideoEngager widget.

### Example Command (for Python Server):
```bash
python3 -m http.server
```

---

## Customization

You can customize the following aspects of the project:

- **Form Fields**: Modify the form fields in `index.html` to collect additional information.
- **Interaction Logic**: Modify the logic in `app.js` to change how form data is transformed or how interactions are handled.
- **Configuration**: Update `config.js` with your specific tenant, API keys, and any other necessary details.

---

## Troubleshooting

- **Library Loading Issues**: If the VideoEngager or CXBus libraries fail to load, check the network console for any loading errors and ensure the URLs are correct.
- **Form Submission Issues**: Ensure that the form data is correctly mapped to the VideoEngager widget using the `transformInputData` function in `app.js`.
- **Session Not Starting**: Check the `libraryFunction` in `app.js` to ensure that the `CXBus.command` is correctly calling `startAudio` or `startVideo`.

---

## Contact

For further help or questions, please contact your Genesys or VideoEngager support representative.

---

### License

This project is licensed under the MIT License.

---

By following the above steps, you will have a fully working VideoEngager integration using Genesys widgets in a simple HTML/JS environment.

