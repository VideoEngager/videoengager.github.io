/* eslint-disable no-console */
class VideoEngager {
  constructor () {
    let popupinstance = null;
    let iframeHolder = null;
    let iframeInstance;
    let oVideoEngager;
    let interactionId;
    let TENANT_ID;
    let startWithVideo;
    let autoAccept;
    let platform;
    let extraAgentMessage;
    let veUrl;
    let enablePrecall;
    let i18n;
    let useWebChatForm;
    let webChatFormData;
    let title;
    let submitButton;
    const i18nDefault = {
      en: {
        ChatFormSubmitVideo: 'Start Video',
        WebChatTitleVideo: 'Video Chat',
        ChatFormSubmitAudio: 'Start Audio',
        WebChatTitleAudio: 'Audio Chat'
      }
    };
    let form;
    let enablePrecallForced;
    const KEEP_ALIVE_TIME = 10 * 60 * 1000; // keep alive time 10min
    let keepAliveTimer;

    const init = function () {
      const config = window._genesys.widgets.videoengager;
      TENANT_ID = config.tenantId;
      startWithVideo = (config.audioOnly) ? !config.audioOnly : true;
      autoAccept = (config.autoAccept) ? config.autoAccept : true;
      platform = config.platform;
      extraAgentMessage = config.extraAgentMessage;
      veUrl = config.veUrl;
      i18n = config.i18n;
      form = config.form;
      enablePrecallForced = config.hasOwnProperty('enablePrecall');
      enablePrecall = config.enablePrecall;
      useWebChatForm = config.useWebChatForm;
      webChatFormData = (config.webChatFormData) ? config.webChatFormData : {};
      if (config.callHolder) {
        iframeHolder = document.getElementById(config.callHolder);
        if (!iframeInstance) {
          console.log('iframe holder is passing, but not found: ', config.callHolder);
        }
      }
    };

    const startVideoEngager = function () {
      if (useWebChatForm) {
        initiateForm();
      } else {
        startWithHiddenChat();
      }
    };

    this.initExtension = function ($, CXBus, Common) {
      console.log('on init extension VideoEngager');
      init();
      oVideoEngager = CXBus.registerPlugin('VideoEngager');
      oVideoEngager.publish('ready');
      oVideoEngager.registerCommand('startVideo', function (e) {
        // videochat channel is selected
        console.log('startVideoTriggered');
        startWithVideo = true;
        startVideoEngager();
      });

      oVideoEngager.registerCommand('startAudio', function (e) {
        startWithVideo = false;
        startVideoEngager();
      });

      oVideoEngager.registerCommand('startVideoEngager', function (e) {
        startVideoEngager();
      });

      oVideoEngager.registerCommand('endCall', function (e) {
        oVideoEngager.command('WebChatService.endChat');
        closeIframeOrPopup();
      });

      oVideoEngager.subscribe('WebChatService.ended', function () {
        console.log('WebChatService.ended');
        if (keepAliveTimer) { clearInterval(keepAliveTimer); }
        closeIframeOrPopup();
      });

      oVideoEngager.subscribe('WebChatService.started', function () {
        console.log('WebChatService.started');

        keepAliveTimer = setInterval(sendKeepAliveMessage, KEEP_ALIVE_TIME);
      });

      oVideoEngager.subscribe('WebChatService.agentConnected', function () {
        console.log('WebChatService.agentConnected');
        sendInteractionMessage(interactionId);
        startVideoChat();
      });

      oVideoEngager.ready();

      window._genesys.widgets.onReady = function (oCXBus) {
        console.log('[CXW] Widget bus has been initialized!');
        oCXBus.command('WebChatService.registerPreProcessor', {
          preprocessor: function (oMessage) {
            if (!oMessage.text || oMessage.text.indexOf(veUrl) === -1) {
              return null;
            }
            const url = oMessage.text;
            oMessage.html = true;
            oMessage.text = '<button type="button" class="cx-btn cx-btn-primary i18n" onclick="videoEngager.startVideoEngagerOutbound(\"' + url + '\");">Start Video</button>';
            return oMessage;
          }
        })
          .done(function (e) {
            console.log('VE WebChatService.registerPreProcessor');
          })
          .fail(function (e) {
            console.error('failed to regsiter preprocessor');
          });
      };
    };

    const initiateForm = function () {
      const webChatOpenData = {
        userData: { veVisitorId: interactionId },
        // prefill values
        form: { /*
                    autoSubmit: false,
                    firstname: 'John',
                    lastname: 'Smith',
                    email: 'John@mail.com',
                    subject: 'Customer Satisfaction'
                    */}
      };
      if (form) {
        webChatOpenData.formJSON = form;
      }

      oVideoEngager.command('WebChat.open', webChatOpenData)
        .done(function (e2) {
          // form opened
          document.getElementsByClassName('cx-submit')[0].addEventListener('click', function () {
            startVideoChat();
          });
          localizeChatForm();
        });
    };
    const localizeChatForm = function () {
      const lang = window._genesys.widgets.main.lang;
      if (startWithVideo) {
        title = i18nDefault.en.WebChatTitleVideo;
        submitButton = i18nDefault.en.ChatFormSubmitVideo;
      } else {
        title = i18nDefault.en.WebChatTitleAudio;
        submitButton = i18nDefault.en.ChatFormSubmitAudio;
      }
      if (startWithVideo) {
        if (i18n[lang] && i18n[lang].WebChatTitleVideo) {
          title = i18n[lang].WebChatTitleVideo;
        }
        if (i18n[lang] && i18n[lang].ChatFormSubmitVideo) {
          submitButton = i18n[lang].ChatFormSubmitVideo;
        }
      } else {
        if (i18n[lang] && i18n[lang].WebChatTitleAudio) {
          title = i18n[lang].WebChatTitleAudio;
        }
        if (i18n[lang] && i18n[lang].ChatFormSubmitAudio) {
          submitButton = i18n[lang].ChatFormSubmitAudio;
        }
      }
      document.getElementsByClassName('cx-title')[0].innerHTML = title;
      document.getElementsByClassName('cx-submit')[0].innerHTML = submitButton;
    };

    this.terminateInteraction = function () {
      closeIframeOrPopup();
      oVideoEngager.command('WebChat.endChat')
        .done(function (e) {
          oVideoEngager.command('WebChat.close');
        })
        .fail(function (e) {
          //
        });
    };

    const sendInteractionMessage = function (interactionId) {
      if (platform === 'purecloud') {
        const message = { interactionId: interactionId };
        // oVideoEngager.command('WebChatService.sendFilteredMessage',{message:JSON.stringify(message), regex: /[a-zA-Z]/})
        oVideoEngager.command('WebChatService.sendMessage', { message: JSON.stringify(message) })
          .done(function (e) {
            console.log('send message success:' + JSON.stringify(message));
            if (extraAgentMessage) {
              oVideoEngager.command('WebChatService.sendMessage', { message: extraAgentMessage })
                .done(function (e) {
                  console.log('send extra message success:', extraAgentMessage);
                })
                .fail(function (e) {
                  console.log('could not send extra message: ', extraAgentMessage);
                });
            }
          })
          .fail(function (e) {
            console.log('fail to send message: ' + message);
          });
      }
    };

    const sendKeepAliveMessage = function () {
      if (platform === 'purecloud') {
        oVideoEngager.command('WebChatService.sendTyping')
          .done(function (e) {
            console.log('send KeepAlive message success');
          })
          .fail(function (e) {
            console.log('fail to send KeepAlive message');
          });
      }
    };
    const startWithHiddenChat = function () {
      if (!webChatFormData.userData) {
        webChatFormData.userData = {};
      }
      if (!webChatFormData.form) {
        webChatFormData.form = {};
      }

      webChatFormData.form.firstName = webChatFormData.firstname;
      webChatFormData.form.lastName = webChatFormData.lastname;
      webChatFormData.form.email = webChatFormData.email;
      webChatFormData.form.subject = webChatFormData.subject;
      webChatFormData.form.message = webChatFormData.message;
      webChatFormData.form.nickName = webChatFormData.nickname;
      webChatFormData.userData.veVisitorId = interactionId;
      startVideoChat();
      oVideoEngager.command('WebChatService.startChat', webChatFormData)
        .done(function (e) {
          console.log('WebChatService started Chat');
        }).fail(function (e) {
          console.error('WebChatService failed to start chat: ', e);
          closeIframeOrPopup();
        });
    };

    const getGuid = function () {
      function s4 () {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    };

    const startVideoChat = function () {
      if (!interactionId) {
        interactionId = getGuid();
      }

      console.log('InteractionId :', interactionId);
      const left = (screen.width / 2) - (770 / 2);
      const top = (screen.height / 2) - (450 / 2);
      const str = {
        video_on: startWithVideo,
        sessionId: interactionId,
        hideChat: true,
        type: 'initial',
        defaultGroup: 'floor',
        view_widget: '4',
        offline: true,
        aa: autoAccept,
        skip_private: true,
        inichat: 'false'
      };

      const encodedString = window.btoa(JSON.stringify(str));
      const homeURL = veUrl + '/static/';
      let url = `${homeURL}popup.html?tennantId=${window.btoa(TENANT_ID)}&params=${encodedString}`;
      if (enablePrecallForced && enablePrecall) {
        url += '&pcfl=true';
      } else if (enablePrecallForced && !enablePrecall) {
        url += '&precall=false';
      }

      if (!iframeHolder) {
        if (!popupinstance) {
          popupinstance = window.open(url, 'popup_instance', 'width=770, height=450, left=' + left + ', top=' + top + ', location=no, menubar=no, resizable=yes, scrollbars=no, status=no, titlebar=no, toolbar = no');
        }
        popupinstance.focus();
      } else {
        iframeInstance = document.createElement('iframe');
        iframeInstance.width = '100%';
        iframeInstance.height = '100%';
        iframeInstance.id = 'videoengageriframe';
        iframeInstance.allow = 'microphone; camera';
        iframeInstance.src = url;
        iframeHolder.querySelectorAll('iframe').forEach(e => e.remove());
        iframeHolder.insertBefore(iframeInstance, iframeHolder.firstChild);
        iframeHolder.style.display = 'block';
      }
    };

    this.startVideoEngagerOutbound = function (url) {
      const left = (screen.width / 2) - (770 / 2);
      const top = (screen.height / 2) - (450 / 2);
      if (!popupinstance) {
        popupinstance = window.open(url, 'popup_instance', 'width=770, height=450, left=' + left + ', top=' + top + ', location=no, menubar=no, resizable=yes, scrollbars=no, status=no, titlebar=no, toolbar = no');
      }
      popupinstance.focus();
    };

    const closeIframeOrPopup = function () {
      interactionId = null;
      if (!iframeHolder) {
        if (popupinstance) {
          popupinstance.close();
        }
        popupinstance = null;
      } else {
        if (iframeHolder.getElementsByTagName('iframe')[0]) {
          iframeHolder.removeChild(iframeHolder.getElementsByTagName('iframe')[0]);
        }
        iframeHolder.style.display = 'none';
      }
    };
  }
}

const videoEngager = new VideoEngager();
window.videoEngager = videoEngager;

const messageHandler = function (e) {
  console.log('messageHandler', e.data);
  if (e.data.type === 'popupClosed') {
    // CXBus.command('VideoEngager.endCall');
    // call not ended
  }
  if (e.data.type === 'callEnded') {
    CXBus.command('VideoEngager.endCall');
  }
};

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
