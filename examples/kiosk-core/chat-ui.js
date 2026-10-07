// Presentation only. app.js decides when to call these four actions.
window.createKioskChat = function () {
  function command(name, alreadyThere) {
    return new Promise((resolve, reject) => window.Genesys('command', name, {}, resolve, reject))
      .catch(error => {
        if ((error?.message || error) !== alreadyThere) console.warn('Could not set Messenger appearance:', error);
      });
  }

  return {
    show() { document.body.classList.remove('messenger-hidden'); },
    hide() { document.body.classList.add('messenger-hidden'); },
    open() { return command('Messenger.open', 'Messenger is already opened.'); },
    minimize() { return command('Messenger.close', 'Messenger is already closed.'); }
  };
};
