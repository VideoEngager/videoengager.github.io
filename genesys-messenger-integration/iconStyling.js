// Wait for the ve-launcher element to be created
function waitForElement (selector, callback) {
  const element = document.getElementById(selector);
  if (element) {
    callback(element);
  } else {
    setTimeout(() => waitForElement(selector, callback), 100);
  }
}

// Wait for ve-launcher to exist, then move it to left-circle
waitForElement('ve-launcher', function (launcher) {
  const leftCircle = document.querySelector('.left-circle');
  if (leftCircle) {
    // Move the launcher inside the left-circle
    leftCircle.appendChild(launcher);
  }
});
