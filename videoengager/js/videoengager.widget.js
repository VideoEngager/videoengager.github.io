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
      customAttributes = config.customAttributes ? config.customAttributes : null;
      if (config.callHolder) {
        iframeHolder = document.getElementById(config.callHolder);
        if (!iframeHolder) {
          console.log('iframe holder is passing, but not found: ', config.callHolder);
        }
      }
    };

    const startVideoEngager = function () {
      if (!interactionId) {
        interactionId = getGuid();
      }
      if (useWebChatForm) {
        initiateForm();
      } else {
        startWithHiddenChat();
      }
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

      oVideoEngager.before('WebChat.open', function (oData) {
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
        // startCalendar();

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

        oVideoEngager.command('Callback.open');
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
            const delimiters = ['\n', ' ', ','];
            const endIndexes = [];
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
      if ((popupinstance && !popupinstance.closed) || iframeInstance) {
        console.log('already have opened video call');
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
        popupinstance = window.open(url, 'popup_instance', 'width=770, height=450, left=' + left + ', top=' + top + ', location=no, menubar=no, resizable=yes, scrollbars=no, status=no, titlebar=no, toolbar = no');
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
      if (!popupinstance || popupinstance.closed) {
        popupinstance = window.open(url, 'popup_instance', 'width=770, height=450, left=' + left + ', top=' + top + ', location=no, menubar=no, resizable=yes, scrollbars=no, status=no, titlebar=no, toolbar = no');
      }
      popupinstance.focus();
    };

    this.configure = function () {
      init();
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
