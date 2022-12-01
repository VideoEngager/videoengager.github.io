/* eslint-disable no-console */
/* global fetch */
const PopupManager = function () {
  const left = (window.screen.width / 2) - (770 / 2);
  const top = (window.screen.height / 2) - (450 / 2);
  const popupSpesification = 'width=770, height=450, left=' + left + ', top=' + top + ', location=no, menubar=no, resizable=yes, scrollbars=no, status=no, titlebar=no, toolbar = no';
  const popupId = 'popup_instance';
  this.popupinstance = null;
  this.attachPopup = function () {
    this.popupinstance = window.open('', popupId, popupSpesification);
    if (!this.popupinstance || this.popupinstance.closed || typeof this.popupinstance.closed === 'undefined') {
      // POPUP BLOCKED
      console.log('popup was closed and popup blocker enabled');
      return false;
    }
    try {
      if (this.popupinstance.location && this.popupinstance.location.host === '') {
        console.log('popup was closed and popup blocker disabled');
        this.close();
        return false;
      }
    } catch (e) {
      console.log('popup exists');
      return true;
    }
    return true;
  };
  this.createPopup = function (url) {
    this.popupinstance = window.open(url, popupId, popupSpesification);
    this.focus();
  };
  this.popupExist = function () {
    return this.popupinstance && !this.popupinstance.closed;
  };
  this.focus = function () {
    console.log('focus',this.popupExist());

    if (this.popupExist()) {
      this.popupinstance.focus();
    }
  };
  this.close = function () {
    if (this.popupExist()) {
      this.popupinstance.close();
      this.popupinstance = null;
    }
  };
};
class VideoEngager {
  constructor() {
    const popupManager = new PopupManager();
    this.popupManager = popupManager;
    this.callExists = false;
    this.checkIfPopupExists = function (){
      if(popupManager.attachPopup()){
        this.callExists = true;
        return true;
      } else {
        this.callExists = false;
        return false;
      }
    }
   
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
    let customAttributes;
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
        if (!iframeHolder) {
          console.log('iframe holder is passing, but not found: ', config.callHolder);
        }
      }
      customAttributes = config.customAttributes ? config.customAttributes : null;
    };
    const checkIfCallExist = async function () {
      return new Promise((resolve, reject) => {
        oVideoEngager.command('WebChatService.verifySession').done(function (e) {
          if (e.sessionActive) {
            console.log('session active alreadyyy');
            resolve(true);
            // dont show chat invite 
          } else if (!e.sessionActive) {
            resolve(false)
          }

        });
      })
    }
    const startVideoEngager = function () {
      checkIfCallExist().then((callExist) => {
        if (callExist) {
          if (popupManager.attachPopup()) {
            popupinstance = popupManager.popupinstance;
            popupinstance
          } else {
            this.terminateInteraction();
          }
        } else {
          if (!interactionId) {
            interactionId = getGuid();
          }
          if (useWebChatForm) {
            initiateForm();
          } else {
            startWithHiddenChat();
          }
        }
      })
      // if (popupManager.popupExist()) {
      //   popupManager.focus();
      //   return;
      // }

    
    };

    const startCalendar = function () {
      oVideoEngager.command('Calendar.generate')
        .done(function (e) {
          console.log(e);
        })
        .fail(function (e) {
          console.error('Calendar failed  : ', e);
        });
    };

    const copyToClipboard = function (e) {
      const copyText = document.getElementById('meetingUrl');
      copyText.select();
      copyText.setSelectionRange(0, 99999);
      navigator.clipboard.writeText(copyText.value);
    };

    const createGoogleCalendarEvent = function (fullText) {
      Date.prototype.addHours = function (h) {
        this.setTime(this.getTime() + (h * 60 * 60 * 1000));
        return this;
      };

      const isoToIcal = function (str) {
        str = str.replace(/-/g, '');
        str = str.replace(/:/g, '');
        str = str.replace('.', '');
        str = str.replace('00000Z', '00Z');
        return str;
      };

      const getContentOfLineDefinition = function (definition) {
        return fullText.substring(fullText.indexOf(definition)).substring(definition.length, fullText.substring(fullText.indexOf(definition)).indexOf('\r'));
      };

      const toIsoWithOffset = function (date) {
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
      };

      const icalStr = getContentOfLineDefinition('DTSTART:');
      const strYear = icalStr.substr(0, 4);
      const strMonth = parseInt(icalStr.substr(4, 2), 10) - 1;
      const strDay = icalStr.substr(6, 2);
      const strHour = icalStr.substr(9, 2);
      const strMin = icalStr.substr(11, 2);
      const strSec = icalStr.substr(13, 2);

      const oDate = new Date(strYear, strMonth, strDay, strHour, strMin, strSec);
      const dates = isoToIcal(toIsoWithOffset(oDate)) + '/' + isoToIcal(toIsoWithOffset(oDate.addHours(1)));

      const googleEvent = {
        baseUrl: 'https://calendar.google.com/calendar/r/eventedit?',
        text: getContentOfLineDefinition('SUMMARY:'),
        dates: dates,
        details: getContentOfLineDefinition('DESCRIPTION:') + '\n' + getContentOfLineDefinition('URL:'),
        location: getContentOfLineDefinition('LOCATION:')
      };

      return `${googleEvent.baseUrl}text=${googleEvent.text}&dates=${googleEvent.dates}&details=${googleEvent.details}&location=${googleEvent.location}`;
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

      oVideoEngager.before("WebChat.open", function (oData) {
        console.log('before webchat open');
        oData.userData = oData.userData ? oData.userData : {};
        if (!oData.userData.veVisitorId) {
          oData.userData.veVisitorId = null;
        }
        return oData;
      });

      oVideoEngager.registerCommand('startWebChat', function (e) {
        oVideoEngager.command('WebChat.open', {
          userData: { veVisitorId: null }
        });
      });

      oVideoEngager.registerCommand('endCall', function (e) {
        oVideoEngager.command('WebChatService.endChat');
        closeIframeOrPopup();
      });

      oVideoEngager.registerCommand('startCalendar', function (e) {
        startCalendar();
      });

      oVideoEngager.subscribe('Callback.opened', function (e) {
        document.querySelector('#cx_form_callback_tennantId').value = window._genesys.widgets.videoengager.tenantId;
        // authenticate
        let date = new Date();
        document.querySelector('#cx_form_callback_phone_number').value = '';
        oVideoEngager.subscribe('CallbackService.scheduleError', function (e) {
          if (e.data.responseJSON && e.data.responseJSON.body) {
            document.querySelector('#cx_callback_information').innerText = e.data.responseJSON.body.message;
          }
        });

        oVideoEngager.subscribe('CallbackService.scheduled', function (e) {
          document.querySelector('#cx-callback-result').innerText = 'Video Call Scheduled';
          if (document.querySelector('#cx-callback-result-number').innerText === '') {
            document.querySelector('#cx-callback-result-desc').remove();
          }
          if (document.querySelector('#cx-callback-result-desc')) {
            document.querySelector('#cx-callback-result-desc').innerText = 'Your Phone Number';
          }
          $('.cx-buttons-default.cx-callback-done').remove();
          $('div.cx-footer.cx-callback-scheduled').remove();
          $('#visitorid').remove();
          $('#icsDataDownload').remove();
          $('#downloadLinkHolder').remove();
          $('#shareURL').remove();
          $('#visitorInfo').remove();
          $('.cx-confirmation-wrapper').css('height', 'auto');
          $('.cx-callback').css('width', '400px');
          if (e && e.data && e.data.videoengager && e.data.videoengager) {
            const scheduleDate = new Date(e.data.videoengager.date);
            let htmlText = '<div id="visitorInfo"><p class="cx-text" id="visitorid">Your meeting is scheduled for</p>';
            htmlText += '<p class="cx-text">' + scheduleDate.toLocaleDateString() + ' ' + scheduleDate.toLocaleTimeString() + '</p>';
            htmlText += '<p class="cx-text">Your Meeting URL</p>';
            htmlText += `<input type="text" value="${e.data.videoengager.meetingUrl}" id="meetingUrl">`;
            htmlText += '<button id="copyURL">Copy URL</button>';
            htmlText += '<p class="cx-text">Add this event to your Calendar</p>';
            htmlText += '</div>';
            $('.cx-confirmation-wrapper').append(htmlText);
          }
          const icsCalendarData = e.data.icsCalendarData;
          let fileName = new Date(e.data.videoengager.date);
          fileName = date.getDate() + '' + (date.getMonth() + 1) + date.getFullYear() + date.getHours() + date.getMinutes() + 'videomeeting';
          const element = document.createElement('a');
          element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(icsCalendarData));
          element.setAttribute('download', fileName + '.ics');
          element.setAttribute('id', 'icsDataDownload');
          element.setAttribute('class', 'cx-btn cx-btn-default abutton');
          element.innerText = 'Download .ics';
          $('.cx-confirmation-wrapper').append('<div id="downloadLinkHolder"></div>');
          $('#downloadLinkHolder').append(element);
          let htmlText = '<a class="cx-btn cx-btn-default abutton" target="_blank" href="' + createGoogleCalendarEvent(icsCalendarData) + '">Add to Google Calendar</a>';
          htmlText += '<a style=" background-color: transparent; border: 0; " class="cx-btn cx-btn-default abutton" target="_blank" href="' + e.data.videoengager.meetingUrl + '">Join Video Meeting</a>';
          $('#downloadLinkHolder').append(htmlText);
          $('#copyURL').click(function (event) {
            event.preventDefault();
            copyToClipboard();
          });
        });

        oVideoEngager.subscribe('Calendar.selectedDateTime', function (e) {
          date = e.data.date;
        });

        // to prevent onClose user confirmation dialog, remove events in inputs
        document.querySelectorAll('input,textarea').forEach((e) => {
          const newElement = e.cloneNode(true);
          e.parentNode.replaceChild(newElement, e);
        });
      });

      oVideoEngager.subscribe('WebChatService.ended', function () {
        console.log('WebChatService.ended');
        if (keepAliveTimer) { clearInterval(keepAliveTimer); }
        closeIframeOrPopup();
      });

      oVideoEngager.subscribe('WebChatService.started', function () {
        console.log('WebChatService.started');

        keepAliveTimer = setInterval(sendKeepAliveMessage, KEEP_ALIVE_TIME);
        if (interactionId) {
          sendInteractionMessage(interactionId);
        }
      });

      oVideoEngager.subscribe('WebChatService.agentConnected', function () {
        console.log('WebChatService.agentConnected');
        if (interactionId) {
          startVideoChat();
        }
      });

      oVideoEngager.ready();

      oVideoEngager.subscribe('WebChatService.ready', function (oCXBus) {
        console.log('[CXW] Widget bus has been initialized!');
        oVideoEngager.command('WebChatService.registerPreProcessor', {
          preprocessor: function (oMessage) {
            if (!oMessage.text || oMessage.text.indexOf(veUrl) === -1) {
              return null;
            }
            const startIndex = oMessage.text.indexOf(veUrl);
            const delimiters = ['\n', ' ', ',']
            const endIndexes = []
            delimiters.forEach(function (value) {
              let endIndex = oMessage.text.indexOf(value, startIndex + 1);
              if (endIndex === -1) {
                endIndex = oMessage.text.length;
              }
              endIndexes.push(endIndex);
            });
            const endIndex = Math.min(...endIndexes);
            window.VE_URL = oMessage.text.substring(startIndex, endIndex);
            const newText = oMessage.text.replace(window.VE_URL, '<button type="button" class="cx-btn cx-btn-primary i18n" onclick="videoEngager.startVideoEngagerOutbound(window.VE_URL);">Start Video</button>');

            oMessage.html = true;
            oMessage.text = newText;
            return oMessage;
          }
        })
          .done(function (e) {
            console.log('VE WebChatService.registerPreProcessor');
          })
          .fail(function (e) {
            console.error('failed to regsiter preprocessor');
          });
      });


      oVideoEngager.subscribe('WebChatService.restored', function (e) {
        console.log('Chat restored', e);
        /**
         * 1 - check if it is a video call from comparing visitor id
         * 2 - recover popup if exist
         * 3 - recover visitor id
         */
        // get current session's interactionId
        CXBus.command('WebChatService.getSessionData').done(function (sessionData) {
          console.log('WebChatService.getSessionData', sessionData);
          const conversationId = sessionData.conversationId;
          const jwt = sessionData.jwt;
          const memberId = sessionData.memberId;
          fetch(window._genesys.widgets.webchat.transport.dataURL + '/api/v2/webchat/guest/conversations/' + conversationId + '/members/' + memberId, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + jwt
            }
          })
            .then(response => response.json())
            .then(data => {
              console.log('Success:', data);
              if (!data || !data.customFields || !data.customFields.veVisitorId) {
                return;
              }
              if (window._genesys.widgets.videoengager.useWebChatForm) {
                localizeChatForm();
              }
              interactionId = data.customFields.veVisitorId;
              if (iframeHolder) {
                const url = generateVisitorUrl();
                iframeInstance = document.createElement('iframe');
                iframeInstance.width = '100%';
                iframeInstance.height = '100%';
                iframeInstance.id = 'videoengageriframe';
                iframeInstance.allow = 'microphone; camera';
                iframeInstance.src = url;
                iframeHolder.querySelectorAll('iframe').forEach(e => e.remove());
                iframeHolder.insertBefore(iframeInstance, iframeHolder.firstChild);
                iframeHolder.style.display = 'block';
                return;
              }
              if (popupManager.attachPopup()) {
                popupManager.focus();
              } else {
                this.terminateInteraction();
              }
            })
            .catch((error) => {
              console.error('Error:', error);
            });
        });
      });
      oVideoEngager.ready();
      oVideoEngager.publish('ready');
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
      const cxTitle = document.getElementsByClassName('cx-title')[0];
      const cxSubmit = document.getElementsByClassName('cx-submit')[0];
      if (cxTitle) {
        cxTitle.innerHTML = title;
      }
      if (cxSubmit) {
        cxSubmit.innerHTML = submitButton;
      }
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
        }).fail(function (err) {

          if (err !== 'There is already an active chat session') {
            console.error('WebChatService failed to start chat: ', e);
            closeIframeOrPopup();
          } else {
            if (popupManager.popupExist() || iframeInstance) {
              popupManager.focus();
              console.log('already have opened video call');
              return;
            } else {
              console.log('terminating interaction')
              this.terminateInteraction();
            }
          }
          // closeIframeOrPopup();
        });
    };

    const getGuid = function () {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    };

    const startVideoChat = function () {
      if (popupManager.popupExist() || iframeInstance) {
        console.log('already have opened video call');
        popupManager.focus();
        return;
      }

      console.log('InteractionId :', interactionId);
      const left = (screen.width / 2) - (770 / 2);
      const top = (screen.height / 2) - (450 / 2);
      let str = {
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
      if (customAttributes) {
        str = Object.assign(str, customAttributes);
      }
      const encodedString = window.btoa(JSON.stringify(str));
      const homeURL = veUrl + '/static/';
      let url = `${homeURL}popup.html?tennantId=${window.btoa(TENANT_ID)}&params=${encodedString}`;
      if (enablePrecallForced && enablePrecall) {
        url += '&pcfl=true';
      } else if (enablePrecallForced && !enablePrecall) {
        url += '&precall=false';
      }

      if (!iframeHolder) {
        popupManager.createPopup(url);
        popupManager.focus();
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
      if (popupManager.attachPopup()) {
        popupManager.focus();
      } else if (!popupManager.popupExist()) {
        popupManager.focus();
      } else {
        popupManager.createPopup(url);
      }
    };

    const closeIframeOrPopup = function () {
      interactionId = null;
      if (!iframeHolder) {
        if (popupManager.popupExist()) {
          popupManager.close();
          popupManager.popupinstance = null
        }
        popupManager.popupinstance = null
      } else {
        if (iframeHolder.getElementsByTagName('iframe')[0]) {
          iframeHolder.removeChild(iframeHolder.getElementsByTagName('iframe')[0]);
        }
        iframeInstance = null;
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
    videoEngager.terminateInteraction()
    // call not ended
  }
  if (e.data.type === 'callEnded') {
    videoEngager.terminateInteraction()
  }
};

if (window.addEventListener) {
  window.addEventListener('message', messageHandler, false);
} else {
  window.attachEvent('onmessage', messageHandler);
}

// terminate call on page close
// window.onbeforeunload = function () {
//   videoEngager.terminateInteraction();
// };

const eventName = 'VideoEngagerReady';
let event;
if (typeof (Event) === 'function') {
  event = new Event(eventName);
} else {
  event = document.createEvent('Event');
  event.initEvent(eventName, true, true);
}
document.dispatchEvent(event);
