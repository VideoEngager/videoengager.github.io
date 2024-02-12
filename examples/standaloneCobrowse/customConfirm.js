(function () {
  // Dynamically inject CSS for the modal to ensure it doesn't conflict with existing styles
  const css = `
      .custom-confirm-modal {
        display: none;  
        position: fixed;  
        z-index: 10000; 
        left: 0;
        top: 0;
        width: 100%; 
        height: 100%; 
        overflow: auto;  
        background-color: rgb(0,0,0);  
        background-color: rgba(0,0,0,0.4);  
      }
  
      .custom-confirm-modal-content {
        background-color: #fefefe;
        margin: 5% auto;
        padding: 20px;
        border: 1px solid #888;
        width: 30%; 
      }
  
      .custom-confirm-btn {
        margin: 10px 5px;
        padding: 10px;
        border: none;
        cursor: pointer;
      }
  
      .custom-confirm-yes {
        background-color: #4CAF50; 
        color: white;
      }
  
      .custom-confirm-no {
        background-color: #f44336; 
        color: white;
      }
    `;

  const head = document.head || document.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  head.appendChild(style);
  style.type = 'text/css';
  if (style.styleSheet) {
    // This is required for IE8 and below.
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  function injectModalHTML () {
    const modalHTML = `
        <div id="customConfirmModal" class="custom-confirm-modal">
          <div class="custom-confirm-modal-content">
            <p id="customConfirmMessage"></p>
            <button id="customConfirmYes" class="custom-confirm-btn custom-confirm-yes">Yes</button>
            <button id="customConfirmNo" class="custom-confirm-btn custom-confirm-no">No</button>
          </div>
        </div>
      `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  window.customConfirm = function (message) {
    return new Promise((resolve) => {
      if (!document.getElementById('customConfirmModal')) {
        injectModalHTML();
      }

      const modal = document.getElementById('customConfirmModal');
      const messageBox = document.getElementById('customConfirmMessage');
      const yesBtn = document.getElementById('customConfirmYes');
      const noBtn = document.getElementById('customConfirmNo');

      messageBox.textContent = message;
      modal.style.display = 'block';

      yesBtn.onclick = () => {
        modal.remove();
        resolve(true);
      };

      noBtn.onclick = () => {
        modal.remove();
        resolve(false);
      };

      window.onclick = (event) => {
        if (event.target === modal) {
          modal.remove();
          resolve(false);
        }
      };
    });
  };
})();
