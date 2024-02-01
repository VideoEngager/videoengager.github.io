// on document load
window.addEventListener('DOMContentLoaded', async function () {
  const introJSInit = function () {
    window.introJs().setOptions({
      dontShowAgain: true,
      steps: [
        { intro: 'Welcome to the VideoEngager CoBrowse demo!' },
        {
          element: 'a[href*="github.com"]',
          intro: 'This is the link to the GitHub repository where you can view the source code for this VideoEngager Cobrowse Demo.'
        },
        {
          element: 'button[onclick*="location.reload();"]',
          intro: 'Click this button to refresh the current page. Useful if you need to reset the demo or reload the latest changes.'
        },
        {
          element: '#demonstration_form',
          intro: 'This section requires the Tenant ID and VideoEngager URL for initialization.'
        },
        {
          element: '#initializeCoBrowse',
          intro: 'After entering the required Tenant ID and VideoEngager URL, click this \'Initialize\' button to start the CoBrowse session.'
        },
        {
          element: '.explanation-text',
          intro: 'A demo form will appear here when cobrowse session is initialized.'
        },
        {
          element: '#clearData',
          intro: 'Use this \'Clear\' button to remove the entered parameters from the form as well as from the local storage.'
        },
        {
          element: '#saveToLocalStorage',
          intro: 'Click the \'Save to Local Storage\' button to save your entered parameters for future use.'
        },
        {
          element: '#tampermonkeyDump',
          intro: 'Click here to generate a cobrowse demo script based on the parameters you provided. This script can be used in your website or in a Tampermonkey script.'
        }
      ]
    }).start();
  };

  introJSInit();
});
