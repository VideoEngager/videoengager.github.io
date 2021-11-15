/* global CXBus */
function VideoEngager () {
  const veContext = {
    popupinstance: null,
    iframeHolder: null,
    iframeInstance: null,
    oVideoEngager: null,
    interactionId: null,
    TENANT_ID: null,
    startWithVideo: null,
    autoAccept: null,
    platform: null,
    veUrl: null,
    enablePrecall: null,
    i18n: null,
    useWebChatForm: null,
    webChatFormData: null,
    enablePrecallForced: null,
    form: null
  };

  const i18nDefault = {
    en: {
      ChatFormSubmitVideo: 'Start Video',
      WebChatTitleVideo: 'Video Chat',
      ChatFormSubmitAudio: 'Start Audio',
      WebChatTitleAudio: 'Audio Chat'
    }
  };

  const init = function () {
    const config = window._genesys.widgets.videoengager;
    veContext.TENANT_ID = config.tenantId;
    veContext.startWithVideo = (config.audioOnly) ? !config.audioOnly : true;
    veContext.autoAccept = (config.autoAccept) ? config.autoAccept : true;
    veContext.platform = config.platform;
    veContext.veUrl = config.veUrl;
    veContext.i18n = config.i18n;
    veContext.form = config.form;
    veContext.enablePrecallForced = Object.prototype.hasOwnProperty.call(config, 'enablePrecall');
    veContext.enablePrecall = config.enablePrecall;
    veContext.useWebChatForm = config.useWebChatForm;
    veContext.webChatFormData = (config.webChatFormData) ? config.webChatFormData : {};
    if (config.callHolder) {
      veContext.iframeHolder = document.getElementById(config.callHolder);
      if (!veContext.iframeInstance) {
        console.log('iframe holder is passing, but not found: ' + config.callHolder);
      }
    }
  };

  function startVideoEngager () {
    if (veContext.interactionId === undefined) {
      veContext.interactionId = getGuid();
    }
    if (veContext.useWebChatForm) {
      initiateForm();
    } else {
      startWithHiddenChat();
    }
  }

  this.initExtension = function ($, CXBus, Common) {
    console.log('on init extension VideoEngager');
    init();
    veContext.oVideoEngager = CXBus.registerPlugin('VideoEngager');
    veContext.oVideoEngager.publish('ready');
    veContext.oVideoEngager.registerCommand('startVideo', function (e) {
      // videochat channel is selected
      console.log('startVideoTriggered');
      veContext.startWithVideo = true;
      startVideoEngager();
    });

    veContext.oVideoEngager.registerCommand('startAudio', function (e) {
      veContext.startWithVideo = false;
      startVideoEngager();
    });

    veContext.oVideoEngager.registerCommand('startVideoEngager', function (e) {
      startVideoEngager();
    });

    veContext.oVideoEngager.registerCommand('endCall', function (e) {
      veContext.oVideoEngager.command('WebChatService.endChat');
      closeIframeOrPopup();
    });

    veContext.oVideoEngager.subscribe('WebChatService.ended', function () {
      console.log('WebChatService.ended');
      closeIframeOrPopup();
    });

    veContext.oVideoEngager.subscribe('WebChatService.started', function () {
      console.log('WebChatService.started');
      if (veContext.interactionId != null) {
        sendInteractionMessage(veContext.interactionId);
      }
    });

    veContext.oVideoEngager.ready();

    window._genesys.widgets.onReady = function (oCXBus) {
      console.log('[CXW] Widget bus has been initialized!');
      oCXBus.command('WebChatService.registerPreProcessor', {
        preprocessor: function (oMessage) {
          if (oMessage.text && oMessage.text.indexOf(veContext.veUrl) !== -1) {
            const url = oMessage.text;
            oMessage.html = true;
            oMessage.text = 'Please press button to start video:<br><br><button type="button" class="cx-btn cx-btn-primary i18n" onclick="videoEngager.startVideoEngagerOutbound(\'' + url + '\');">Start video</button>';
            return oMessage;
          }
        }
      })
        .done(function () {
          console.log('VE WebChatService.registerPreProcessor');
        })
        .fail(function () {
          console.error('failed to regsiter preprocessor');
        });
    };
  };

  function initiateForm () {
    const webChatOpenData = {
      userData: { veVisitorId: veContext.interactionId },
      // prefill values
      form: {/*
        autoSubmit: false,
        firstname: 'John',
        lastname: 'Smith',
        email: 'John@mail.com',
        subject: 'Customer Satisfaction'
        */
      }
    };
    if (veContext.form) {
      webChatOpenData.formJSON = veContext.form;
    }

    veContext.oVideoEngager.command('WebChat.open', webChatOpenData)
      .done(function () {
        // form opened
        document.getElementsByClassName('cx-submit')[0].addEventListener('click', function () {
          startVideoChat();
        });
        localizeChatForm();
      });
  }

  function localizeChatForm () {
    const lang = window._genesys.widgets.main.lang;
    let title, submitButton;
    if (veContext.startWithVideo) {
      title = i18nDefault.en.WebChatTitleVideo;
      submitButton = i18nDefault.en.ChatFormSubmitVideo;
    } else {
      title = i18nDefault.en.WebChatTitleAudio;
      submitButton = i18nDefault.en.ChatFormSubmitAudio;
    }
    if (veContext.startWithVideo) {
      if (veContext.i18n[lang] && veContext.i18n[lang].WebChatTitleVideo) {
        title = veContext.i18n[lang].WebChatTitleVideo;
      }
      if (veContext.i18n[lang] && veContext.i18n[lang].ChatFormSubmitVideo) {
        submitButton = veContext.i18n[lang].ChatFormSubmitVideo;
      }
    } else {
      if (veContext.i18n[lang] && veContext.i18n[lang].WebChatTitleAudio) {
        title = veContext.i18n[lang].WebChatTitleAudio;
      }
      if (veContext.i18n[lang] && veContext.i18n[lang].ChatFormSubmitAudio) {
        submitButton = veContext.i18n[lang].ChatFormSubmitAudio;
      }
    }
    document.getElementsByClassName('cx-title')[0].innerHTML = title;
    document.getElementsByClassName('cx-submit')[0].innerHTML = submitButton;
  }

  this.terminateInteraction = function () {
    closeIframeOrPopup();
    veContext.oVideoEngager.command('WebChat.endChat')
      .done(function (e) {
        veContext.oVideoEngager.command('WebChat.close');
      })
      .fail(function (e) {
        //
      });
  };

  function sendInteractionMessage (interactionId) {
    if (veContext.platform === 'purecloud') {
      const message = { interactionId: interactionId };
      // oVideoEngager.command('WebChatService.sendFilteredMessage',{message:JSON.stringify(message), regex: /[a-zA-Z]/})
      veContext.oVideoEngager.command('WebChatService.sendMessage', { message: JSON.stringify(message) })
        .done(function (e) {
          console.log('send message success:' + message);
        })
        .fail(function (e) {
          console.log('fail to send message: ' + message);
        });
    }
  }

  function startWithHiddenChat () {
    if (!veContext.webChatFormData.userData) {
      veContext.veContext.webChatFormData.userData = {};
    }
    if (!veContext.webChatFormData.form) {
      veContext.webChatFormData.form = {};
    }

    veContext.webChatFormData.form.firstName = veContext.webChatFormData.firstname;
    veContext.webChatFormData.form.lastName = veContext.webChatFormData.lastname;
    veContext.webChatFormData.form.email = veContext.webChatFormData.email;
    veContext.webChatFormData.form.subject = veContext.webChatFormData.subject;
    veContext.webChatFormData.form.message = veContext.webChatFormData.message;
    veContext.webChatFormData.form.nickName = veContext.webChatFormData.nickname;
    veContext.webChatFormData.userData.veVisitorId = veContext.interactionId;
    startVideoChat();
    veContext.oVideoEngager.command('WebChatService.startChat', veContext.webChatFormData)
      .done(function (e) {
        console.log('WebChatService started Chat');
      }).fail(function (e) {
        console.error('WebChatService failed to start chat: ', e);
        closeIframeOrPopup();
      });
  }

  function getGuid () {
    function s4 () {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  function startVideoChat () {
    console.log('InteractionId :', veContext.interactionId);
    const left = (window.screen.width / 2) - (770 / 2);
    const top = (window.screen.height / 2) - (450 / 2);
    const str = {
      video_on: veContext.startWithVideo,
      sessionId: veContext.interactionId,
      hideChat: true,
      type: 'initial',
      defaultGroup: 'floor',
      view_widget: '4',
      offline: true,
      aa: veContext.autoAccept,
      skip_private: true,
      inichat: 'false'
    };

    const encodedString = window.btoa(JSON.stringify(str));
    const homeURL = veContext.veUrl + '/static/';
    let url = homeURL + 'popup.html?tennantId=' + window.btoa(veContext.TENANT_ID) + '&params=' + encodedString;
    if (veContext.enablePrecallForced && veContext.enablePrecall) {
      url += '&pcfl=true';
    } else if (veContext.enablePrecallForced && !veContext.enablePrecall) {
      url += '&precall=false';
    }

    if (!veContext.iframeHolder) {
      if (!veContext.popupinstance) {
        veContext.popupinstance = window.open(url, 'popup_instance', 'width=770, height=450, left=' + left + ', top=' + top + ', location=no, menubar=no, resizable=yes, scrollbars=no, status=no, titlebar=no, toolbar = no');
      }
      veContext.popupinstance.focus();
    } else {
      veContext.iframeInstance = document.createElement('iframe');
      veContext.iframeInstance.width = '100%';
      veContext.iframeInstance.height = '100%';
      veContext.iframeInstance.id = 'videoengageriframe';
      veContext.iframeInstance.allow = 'microphone; camera';
      veContext.iframeInstance.src = url;
      veContext.iframeHolder.insertBefore(veContext.iframeInstance, veContext.iframeHolder.firstChild);
      veContext.iframeHolder.style.display = 'block';
    }
  }

  this.startVideoEngagerOutbound = function (url) {
    const left = (window.screen.width / 2) - (770 / 2);
    const top = (window.screen.height / 2) - (450 / 2);
    if (!veContext.popupinstance) {
      veContext.popupinstance = window.open(url, 'popup_instance', 'width=770, height=450, left=' + left + ', top=' + top + ', location=no, menubar=no, resizable=yes, scrollbars=no, status=no, titlebar=no, toolbar = no');
    }
    veContext.popupinstance.focus();
  };

  function closeIframeOrPopup () {
    veContext.interactionId = null;
    if (!veContext.iframeHolder) {
      if (veContext.popupinstance) {
        veContext.popupinstance.close();
      }
      veContext.popupinstance = null;
    } else {
      if (veContext.iframeHolder.getElementsByTagName('iframe')[0]) {
        veContext.iframeHolder.removeChild(veContext.iframeHolder.getElementsByTagName('iframe')[0]);
      }
      veContext.iframeHolder.style.display = 'none';
    }
  }
}

const videoEngager = new VideoEngager();
window.videoEngager = videoEngager;

function messageHandler (e) {
  console.log('messageHandler', e.data);
  if (e.data.type === 'popupClosed') {
    CXBus.command('VideoEngager.endCall');
  }
  if (e.data.type === 'callEnded') {
    CXBus.command('VideoEngager.endCall');
  }
}

if (window.addEventListener) {
  window.addEventListener('message', messageHandler, false);
} else {
  window.attachEvent('onmessage', messageHandler);
}

// terminate call on page close
window.onbeforeunload = function () {
  videoEngager.terminateInteraction();
};

const eventName = 'VideoEngagerReady';
let event;
if (typeof (Event) === 'function') {
  event = new Event(eventName);
} else {
  event = document.createEvent('Event');
  event.initEvent(eventName, true, true);
}
document.dispatchEvent(event);
