const tampermonkeyPrepare = async function () {
  const veUrl = document.querySelector('#veUrl').value;
  const tenantId = document.querySelector('#tenantId').value;
  if (!veUrl || !tenantId) {
    console.error('Please fill in VE URL and Tenant ID to create tampermonkey script');
    return;
  }
  try {
    // get file from ./cobrosedemo.txt
    const response = await fetch('/examples/standaloneCobrowse/cobrowseTemplate.txt');
    let text = await response.text();
    text = text.replace(/\$\{veUrl\}/g, veUrl);
    text = text.replace(/\$\{tenantId\}/g, tenantId);
    text = text.replace(/\$\{librarySetup\}/g, window.librarySetup.toString());
    text = text.replace(/\$\{cobrowseEventHandlers\}/g, window.cobrowseEventHandlers.toString());
    text = text.replace(/\$\{UIEventHandlers\}/g, window.UIEventHandlers.toString());
    document.querySelector('#tampermonkeybutton').removeAttribute('disabled');
    document.querySelector('#tampermonkeydump').innerHTML = text;
  } catch (e) {
    console.error(e.toString());
  }
  document.querySelector('#downloadtamper').addEventListener('click', function () {
    const element = document.createElement('a');
    const text = document.querySelector('#tampermonkeydump').textContent;
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', `cobrowsedemo-${new Date().toISOString()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  });

  const elem = document.getElementById('tampermonkeydump');
  window.hljs.highlightElement(elem);
};

window.addEventListener('DOMContentLoaded', async function () {
  document.querySelector('#initializeCoBrowse').addEventListener('click', tampermonkeyPrepare);
  document.getElementById('copyButton').addEventListener('click', function () {
    const textToCopy = document.getElementById('tampermonkeydump').textContent;
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = textToCopy;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextArea);
    const copyButton = document.getElementById('copyButton');
    copyButton.classList.add('blink');
    setTimeout(function () {
      copyButton.classList.remove('blink');
    }, 400);
  });
});
