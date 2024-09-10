// Function to transform input data to uppercase and map form data to library format
function transformInputData(formData) {
    // Clean the previous form data for the webChatFormData in the VideoEngager widget.
    Object.keys(window._genesys.widgets.videoengager.webChatFormData).forEach(
      (key) => delete window._genesys.widgets.videoengager.webChatFormData[key],
    );
    // Initialize an empty userData object inside the form data.
    window._genesys.widgets.videoengager.webChatFormData.userData = {};

    // Mapping form input fields from the web page to the required properties for the VideoEngager widget.
    const mapping = {
      name: 'firstname',         // Map 'name' field to 'firstname'
      firstName: 'firstname',    // Map 'firstName' field to 'firstname'
      lastName: 'lastname',      // Map 'lastName' field to 'lastname'
      email: 'email',            // Map 'email' field to 'email'
      email2: 'email'           // Map 'email2' field to 'email'
    };

    // Additional mapping for userData to store extended form fields.
    const mappingUserData = {
      phone: 'phoneNumber',      // Map 'phone' field to 'phoneNumber'
      subject: 'subject',        // Map 'subject' field to 'subject'
      productId: 'customerId'    // Map 'productId' field to 'customerId'
    };

    // Iterating over the defined mapping and copying data from the form to the widget's data structure.
    Object.keys(mapping).forEach(key => {
      if (formData.get(key)) {  // Check if the form field is present.
        window._genesys.widgets.videoengager.webChatFormData[mapping[key]] = formData.get(key);
      }
    });

    // Mapping specific fields into userData for extended metadata (like phone number, subject).
    Object.keys(mappingUserData).forEach(key => {
      if (formData.get(key)) {  // Check if the form field exists.
        window._genesys.widgets.videoengager.webChatFormData.userData[mapping[key]] = formData.get(key);
      }
    });
}

// Function to dynamically load external libraries such as Genesys CXBus and VideoEngager
function loadExternalLibrary(callback) {
    const widgetBaseUrl = 'https://apps.mypurecloud.com/widgets/9.0/'; // Base URL for the Genesys widgets.
    const widgetScriptElement = document.createElement('script'); // Create a <script> element to load the library.

    widgetScriptElement.setAttribute('src', widgetBaseUrl + 'cxbus.min.js'); // Set the source to CXBus script.
    document.body.appendChild(widgetScriptElement); // Append the script to the body to load it.
    
    // Once the library is loaded, configure CXBus and load additional files (e.g., VideoEngager widget).
    widgetScriptElement.addEventListener('load', function () {
      CXBus.configure({ debug: true, pluginsPath: widgetBaseUrl + 'plugins/' }); // Initialize the CXBus with debugging.

      // Load the VideoEngager widget from its CDN.
      CXBus.loadFile('https://cdn.videoengager.com/videoengager/js/videoengager.widget.min.js')
        // Once VideoEngager is loaded, load the configuration file.
        .done(() => CXBus.loadFile('config.js')
        // Load the core Genesys widgets plugin after the config is loaded.
          .done(() => CXBus.loadPlugin('widgets-core')
            .done(() => {
                if(callback) callback(); // If the callback exists, call it after all loading is completed.
            }))).fail(function(e){
                console.error('Failed loading videoengager widget library', e) // Handle error during the library load.
            });
    });
}

// Placeholder function to execute VideoEngager functionality (start audio or video session)
function libraryFunction(data, action, onCompletion) {
    console.log("Executing library function with data: ", data); // Log the data that will be processed.
    
    // Depending on the action ('audio' or 'video'), trigger the respective VideoEngager command.
    switch(action) {
        case 'audio':
            CXBus.command('VideoEngager.startAudio'); // Start audio interaction.
            break;
        case 'video':
            CXBus.command('VideoEngager.startVideo'); // Start video interaction.
            break;
        default:
            console.error('Unknown action'); // Handle unknown action cases.
            break;
    }

    // Subscribe to WebChatService events from CXBus for monitoring the chat status.
    
    // Event subscription for when the interaction ends.
    CXBus.subscribe('WebChatService.ended', function () {
      console.log('Interaction Ended'); // Log the end of the chat.
      onCompletion(); // Call the completion callback when the chat ends.
    });

    // Event subscription for when the interaction starts.
    CXBus.subscribe('WebChatService.started', function () {
      console.log('Interaction started'); // Log the start of the chat.
    });

    // Event subscription to handle when the chat is restored after disconnection.
    CXBus.subscribe('WebChatService.restored', function (e) {
      console.error('Chat restored, cleaning it: ' + JSON.stringify(e)); // Log and handle restored chat.
      CXBus.command('WebChatService.endChat'); // End the chat when it's restored (cleanup scenario).
      onCompletion(); // Call completion after cleanup.
    });

    // Event subscription to handle errors in the web chat service.
    CXBus.subscribe('WebChatService.error', function (e) {
      console.error('WebService error: ' + JSON.stringify(e)); // Log the error.
      onCompletion(); // Call completion after error handling.
    });
}

// Event listener to handle form submission interactions once the document is ready.
document.addEventListener('DOMContentLoaded', () => {
    // Load the external library before any form submissions occur.
    loadExternalLibrary(() => {

        // Function to handle form submission, disabling buttons, and starting interactions.
        function handleFormSubmit(form, submitButton, triggerButton, action) {
            const formData = new FormData(form); // Get the data from the form.
            transformInputData(formData); // Transform the form data into the format needed by VideoEngager.

            submitButton.disabled = true; // Disable the submit button to prevent duplicate submissions.
            form.classList.add('hidden'); // Hide the form once it is submitted.
            triggerButton.classList.add('disabled'); // Change the trigger button color to indicate processing.

            // Execute the library function with transformed data and action (audio/video).
            libraryFunction(formData, action, () => {
                triggerButton.classList.remove('disabled'); // Reset button color when the process is complete.
                alert("Processing completed! Button color reset."); // Notify the user that the process is complete.
            });
        }

        // Function to show the form and enable the submit button when interaction is started.
        function showForm(form, submitButton) {
            form.classList.remove('hidden'); // Show the form when interaction starts.
            submitButton.disabled = false; // Enable the submit button.
        }

        // Interactions for the Audio button.
        const audioBtn = document.getElementById('audioBtn'); // Get the Audio button element.
        const form1 = document.getElementById('form1'); // Get the Audio form element.
        const submitButton1 = form1.querySelector('input[type="submit"]'); // Get the submit button for Audio form.

        // Add event listener for the Audio button click to show the form.
        audioBtn.addEventListener('click', () => {
            showForm(form1, submitButton1); // Show the audio form.
        });

        // Handle form submission for Audio interaction.
        form1.addEventListener('submit', function (event) {
            event.preventDefault(); // Prevent the default form submission behavior.
            handleFormSubmit(form1, submitButton1, audioBtn, 'audio'); // Handle the Audio form submission.
        });

        // Interactions for the Video button.
        const videoBtn = document.getElementById('videoBtn'); // Get the Video button element.
        const form2 = document.getElementById('form2'); // Get the Video form element.
        const submitButton2 = form2.querySelector('input[type="submit"]'); // Get the submit button for Video form.

        // Add event listener for the Video button click to show the form.
        videoBtn.addEventListener('click', () => {
            showForm(form2, submitButton2); // Show the video form.
        });

        // Handle form submission for Video interaction.
        form2.addEventListener('submit', function (event) {
            event.preventDefault(); // Prevent the default form submission behavior.
            handleFormSubmit(form2, submitButton2, videoBtn, 'video'); // Handle the Video form submission.
        });
    });
});
