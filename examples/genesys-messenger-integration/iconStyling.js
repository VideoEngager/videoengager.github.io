// Wait for the ve-launcher element to be created
function waitForElement(selector, callback) {
    const element = document.getElementById(selector);
    if (element) {
        callback(element);
    } else {
        setTimeout(() => waitForElement(selector, callback), 100);
    }
}

// Wait for element by class name
function waitForElementByClass(className, callback) {
    const element = document.querySelector('.' + className);
    if (element) {
        callback(element);
    } else {
        setTimeout(() => waitForElementByClass(className, callback), 100);
    }
}

// Wait for ve-launcher to exist, then move it to left-circle
waitForElement('ve-launcher', function(launcher) {
    const leftCircle = document.querySelector('.left-circle');
    if (leftCircle) {
        // Move the launcher inside the left-circle
        leftCircle.appendChild(launcher);
        console.log('VE Launcher moved to left-circle!');
    } else {
        // VE Launcher moved to left-circle
    } else {
        // Left circle not found
    }
});

// Wait for genesys-mxg-frame to exist, then move it to right-circle
waitForElementByClass('genesys-mxg-frame', function(genesysFrame) {
    const rightCircle = document.querySelector('.right-circle');
    if (rightCircle) {
        // Move the genesys frame inside the right-circle
        rightCircle.appendChild(genesysFrame);
        console.log('Genesys frame moved to right-circle!');
    } else {
        // Genesys frame moved to right-circle
    } else {
        // Right circle not found
    }
});