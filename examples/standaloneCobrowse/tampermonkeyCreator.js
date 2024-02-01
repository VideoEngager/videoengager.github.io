const tampermonkeyPrepare = async function () {
  const veUrl = document.querySelector('#veUrl').value;
  const tenantId = document.querySelector('#tenantId').value;
  if (!veUrl || !tenantId) {
    console.error('Please fill in VE URL and Tenant ID to create tampermonkey script');
    return;
  }
  try {
    // get file from ./cobrosedemo.txt
    const response = await fetch('/examples/standaloneCobrowse/cobrowsedemo.txt');
    let text = await response.text();
    text = text.replace(/\$\{veUrl\}/g, veUrl);
    text = text.replace(/\$\{tenantId\}/g, tenantId);
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
});
