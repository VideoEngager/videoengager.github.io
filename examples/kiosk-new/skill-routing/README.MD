# Skills-Based Routing Implementation in SmartVideo Kiosk Demo

This guide is designed to assist developers in integrating Skills-Based Routing (SBR) within the SmartVideo Kiosk Demo, leveraging Genesys PureCloud skills based routing. The objective is to optimize customer service interactions by directing inquiries to agents best suited based on their skills or language proficiencies. The documentation will walk you through setting up queues, configuring the demo, and customizing language settings for a seamless user experience.

## Prerequisites
- Access to Genesys PureCloud Admin Panel.
- Basic understanding of JavaScript and web technologies.
- Familiarity with Genesys PureCloud WebChat and API documentation.

## Step 1: Queue Setup in PureCloud

1. **Access PureCloud Admin Panel**: Log in to your PureCloud account and navigate to the Admin Panel.
2. **Create Queue**:
   - Navigate to the Queue management section.
   - Click on "Create" to set up a new queue.
   - Choose "Standard" as the Routing Method to ensure straightforward chat assignment.
   - Select "All skills matching" for the Evaluation Method to utilize the full spectrum of agent skills for routing decisions.
   - For detailed instructions, refer to the [Create Queues guide](https://help.mypurecloud.com/articles/create-queues/).

3. **Note Queue Name**: After queue creation, record the queue name for configuration purposes.

## Step 2: Configuration Adjustments

1. **Update Configuration File (`config/conf.js`)**:
   - Locate the `GENESYS_CONFIG` section within `conf.js`.
   - Insert the queue name obtained from Step 1 into the configuration to target the correct queue.
   - Add necessary skills or languages under the appropriate categories. For language skills, ensure they align with your customer base's needs.
   - Adjust other parameters in `GENESYS_CONFIG` as needed to fit your operational requirements.

2. **Language and Skill Configuration**:
   - To add more languages, modify the "lang" variable in `js/kiosk.js` (typically around line 74).
   - Correspondingly, update the `GENESYS_CONFIG` in `conf.js` with the added languages and skills.
   - For guidance on creating new skills, consult the [Add ACD Skill guide](https://help.mypurecloud.com/articles/add-acd-skill/).
   - To assign skills to users, refer to [Assign Skills to Multiple Users](https://help.mypurecloud.com/articles/assign-skills-multiple-users/).

## Step 3: Demo Testing and Language Adjustment

1. **Initiate Demo**:
   - Open `index.html` in a web browser to start the SmartVideo integration demo.
   - By default, the demo is set to English.

2. **Language Switching**:
   - To test the demo in different languages, append the "lang" parameter to the URL with the desired language code (e.g., `https://domain.com/index.html?lang=de` for German).
   - The system will then seek an agent with the corresponding language skill or other configured skills.

3. **Real-Life Application**:
   - The "lang" query parameter is used here for demonstration purposes.
   - In practical scenarios, you might employ different logic or methods to select skills conditionally, depending on your project requirements.

## Additional Resources

- **Genesys Web Chat API**: Explore the [Genesys Web Chat API documentation](https://developer.genesys.cloud/commdigital/digital/webchat/guestchat#post-api-v2-webchat-guest-conversations) for more insights on custom integrations and API usage.
- **Skills-Based Routing (SBR) in PureCloud**: Gain a deeper understanding of SBR through PureCloud's [Skills-Based Routing glossary entry](https://help.mypurecloud.com/glossary/skills-based-routing-sbr/).


# Kiosk Demo Configuration Guide

This README provides instructions for configuring the kiosk demo. Follow these steps to customize your kiosk experience.

### Configuring Genesys Settings

1. Navigate to `./config/conf.js` in the kiosk root folder.
2. Find the `window.GENESYS_CONFIG` setting.
3. Replace the existing configuration with your Genesys configuration details.

### Customizing Carousel Images

1. In the same `conf.js` file, locate `window.CAROUSEL_ITEMS`.
2. This setting expects an array of objects in the form: `Array<{src:string}>`.
3. Edit this array to include the paths to the images you want to display during the loading state.

### Changing the Background Image

1. Still in `conf.js`, find the `window.BACKGROUND_IMAGE` setting.
2. Replace the current value with the path to your desired background image.

### Additional Notes

- Changes will take effect after restarting the kiosk application.
- The kiosk web app can be run locally by opening the file path in a browser.
