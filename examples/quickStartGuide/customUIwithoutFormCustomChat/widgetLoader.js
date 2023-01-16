let lastMessage;
function loadLibraries () {
  window.CXBus.configure({ debug: true, pluginsPath: 'https://apps.mypurecloud.com/widgets/9.0/plugins/' });
  window.CXBus.loadPlugin('widgets-core')
    .done(function () {
      startButtonsListeners();
      subscribeToGenesysListeners();
    });
}
function subscribeToGenesysListeners () {
  const webChatButton = document.getElementById('webChatButton');
  const endWebChatButton = document.getElementById('endWebChatButton');
  const agentIsTypingElement = document.getElementById('agentIsTyping');
  const chatWidgetElement = document.getElementById('chatWidget');

  // Genesys widget listeners
  window.CXBus.subscribe('WebChatService.messageReceived', (event) => {
    console.log('WebChatService.messageReceived', event);
    const newMessages = event.data?.messages || [];
    updateMessages(newMessages);
  });

  /** 3. WebChat.started || handle the Call Placed Event event
 * (this means that user has submitted the Registration Form and the call is waiting to be picked by an agent) */
  window.CXBus.subscribe('WebChatService.started', (e) => {
    chatWidgetElement.style.display = '';
    endWebChatButton.style.display = '';
    webChatButton.style.display = 'none';
    console.log('WebChatService.started', e);
  });
  window.CXBus.subscribe('WebChatService.restored', (e) => {
    chatWidgetElement.style.display = '';
    endWebChatButton.style.display = '';
    webChatButton.style.display = 'none';
    console.log('WebChatService.restored', e);
  });
  window.CXBus.subscribe('WebChatService.agentTypingStarted', (e) => {
    agentIsTypingElement.style.display = '';
  });
  window.CXBus.subscribe('WebChatService.agentTypingStopped', (e) => {
    agentIsTypingElement.style.display = 'none';
  });
  window.CXBus.subscribe('WebChatService.agentTypingTimeout', (e) => {
    agentIsTypingElement.style.display = 'none';
  });

  // 4. WebChat.ended || handle call ended event
  window.CXBus.subscribe('WebChatService.ended', (e) => {
    chatWidgetElement.style.display = 'none';
    endWebChatButton.style.display = 'none';
    webChatButton.style.display = '';
  });

  // 6. WebChatService.error || handle call failed event
  window.CXBus.subscribe('WebChatService.error', function (err) {
    // showVideoButton();
    console.error(err);
  });
  /** handling SmartVideo Call  Events */

  window.addEventListener('message', function (event) {
    /** 1. CallStarted || SmartVideo Call has been connected
       * (this means that the agent has picked the call and call started) */
    // if (event.data && event.data.type === 'CallStarted') {
    // }
    /** 1. popupClosed || This means that the user has closed the SmartVideo Call */
    if (event.data && event.data.type === 'popupClosed') {
      window.CXBus.command('WebChatService.endChat');
    }
  }, false);
}
function validateFormInputs () {
  const reportValidity = document.forms.customForm.reportValidity();

  if (reportValidity) {
    return true;
  } else {
    throw new Error('Please fill all required fields');
  }
}
function getInputs () {
  validateFormInputs();
  const subject = document.getElementById('subjectInput').value;
  const nickName = document.getElementById('nickNameInput').value;
  const lastName = document.getElementById('lastNameInput').value;
  const firstName = document.getElementById('firstNameInput').value;
  return {
    subject,
    nickName,
    lastName,
    firstName
  };
}

function startButtonsListeners () {
  const webChatButton = document.getElementById('webChatButton');
  webChatButton.style.display = '';
  webChatButton.addEventListener('click', function () {
    startWebChat();
  });
}

function startWebChat () {
  return new Promise(function (resolve, reject) {
    const form = getInputs();
    window.CXBus.command('WebChatService.startChat', {
      form: {
        firstname: form.firstName,
        lastname: form.lastName,
        subject: form.subject,
        nickname: form.nickName
      },
      userData: {
        customField1: 'True',
        customField1Label: 'Custom Chat Enabled'
      }
    }).done(function () {
      resolve();
    }).fail(function (err) {
      reject(err);
    });
  });
}

/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */
function htmlToElement (html) {
  const template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}
// const regex = /\\n|\\r\\n|\\n\\r|\\r/g;
function createNewMessage (message) {
  const messageText = message.text.replace(/(?:\r\n|\r|\n)/g, '<br>');

  const messageElementHTML = `<div class="chat-message animate__animated animate__fadeIn" data-user-type="${message.from.type}">
                    <div class="flex  ${message.from.type === 'Client' ? 'items-end justify-end' : 'items-end'} " >
                        <div data-container="messagesHolder" class="flex flex-col space-y-2 text-xs max-w-[340px] mx-2 ${message.from.type === 'Client' ? 'order-1 items-end' : 'order-2 items-star'} ">
                             <div id="${message.id}" class="animate__animated  ${message.from.type === 'Client' ? 'animate__slideInLeft' : 'animate__slideInRight'}"><span class="px-4 py-2 whitespace-normal rounded-lg inline-block ${message.from.type === 'Client' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}">${messageText}</span></div>
                         <img src="${message.from.type}.svg"
                           alt="My profile" class="w-6 h-6 animate__animated ${message.from.type === 'Client' ? 'animate__slideInLeft' : 'animate__slideInRight'}  rounded-full ${message.from.type === 'Client' ? 'order-2' : 'order-1'}">
                    </div>
                 </div>`;
  const messageElement = htmlToElement(messageElementHTML);
  const messagesContiner = document.getElementById('messages');
  messagesContiner.appendChild(messageElement);
}
function injectMessage (message, lastMessage) {
  const messageText = message.text.replace(/(?:\r\n|\r|\n)/g, '<br>');

  const messageElementHTML = `<div id="${message.id}"  class="animate__animated ${message.from.type === 'Client' ? 'animate__slideInLeft' : 'animate__slideInRight'} "><span class="whitespace-normal animate__animated animate__fadeIn px-4 py-2 rounded-lg inline-block ${message.from.type === 'Client' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}">${messageText}</span></div>`;
  const messageElement = htmlToElement(messageElementHTML);

  const lastMessageElement = document.getElementById(lastMessage.id);
  lastMessageElement.parentElement.appendChild(messageElement);
}

function addNewMessage (message, lastMessage) {
  let createFunction = createNewMessage;
  if (!lastMessage) {
    createFunction = createNewMessage;
  } else if (lastMessage.from.type !== message.from.type) {
    createFunction = createNewMessage;
  } else {
    createFunction = injectMessage;
  }
  createFunction(message, lastMessage);
  const messagesContiner = document.getElementById('messages');
  messagesContiner.scrollTop = messagesContiner.scrollHeight;
}
function updateMessages (messages) {
  // const messagesContiner = document.getElementById('messages');
  // messagesContiner.innerHTML = '';
  for (const singleMessage of messages) {
    if (singleMessage.type !== 'Message') continue;
    addNewMessage(singleMessage, lastMessage);
    lastMessage = singleMessage;
  }
}
function onChatSubmit () {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value;
  messageInput.value = '';
  autoGrow(messageInput);
  window.CXBus.command('WebChatService.sendMessage', {
    message
  }).fail(() => {
    messageInput.value = message;
    autoGrow(messageInput);
  });
  return false;
}
function endChatCommand () {
  window.CXBus.command('WebChatService.endChat');
}
function sendIsTyping () {
  window.CXBus.command('WebChatService.sendTyping');
}
function autoGrow (element) {
  element.style.height = '30px';
  element.style.height = (element.scrollHeight) + 'px';
}
window.autoGrow = autoGrow;
window.endChatCommand = endChatCommand;
window.onChatSubmit = onChatSubmit;
window.sendIsTyping = sendIsTyping;
loadLibraries();
