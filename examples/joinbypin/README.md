# Join by PIN Demo

This demo showcases how to allow customers to join a VideoEngager video call using a secure, short PIN provided by an agent. It includes two integration methods: a standalone customer-facing web page and a browser extension script (Tampermonkey) for overlaying the PIN prompt on existing websites.

## Included Files

* **`pin-page-light.html`**: A lightweight, responsive, standalone portal where users can enter their 4-6 digit PIN to join a call. Features built-in error handling and Google reCAPTCHA v2 fallback after multiple failed attempts.
* **`PIN-1.1.0.user.js`**: A user script (Tampermonkey/Greasemonkey) that injects a floating "Join with PIN" button onto configured web pages. Clicking the button opens a modal to validate the PIN, which then launches the video call in a draggable, resizable floating iframe.

## Setup & Configuration

### Standalone Page (`pin-page-light.html`)
1. Host the HTML file on your web server.
2. Search the file for `YOUR_RECAPTCHA_SITEKEY_HERE` and replace it with your actual Google reCAPTCHA v2 Site Key.
3. If necessary, update the `serverURL` variable to point to your specific VideoEngager tenant environment.

### Tampermonkey Script (`PIN-1.1.0.user.js`)
1. Install a user script manager like [Tampermonkey](https://www.tampermonkey.net/) in your browser.
2. Create a new script and paste the contents of `PIN-1.1.0.user.js`.
3. Modify the `@match` directives at the top of the file to specify which domains the floating button should appear on.
4. Save and enable the script. 

## API Flow
Both methods utilize the VideoEngager PIN validation endpoint:
`GET /api/shorturls/pin/{pin}`
* **200 OK:** Returns a JSON object containing the `shortUrl` to join the room.
* **400/403/404/429:** Handles invalid, expired, or rate-limited attempts.