

var VideoEngager = function () {
	var popupinstance = null;
	var iframeHolder = null;
	var iframeInstance;
	var oVideoEngager;
	var interactionId;
	var TENANT_ID;
	var startWithVideo;
	var autoAccept;
	var platform;
	var veUrl;
	var enablePrecall;
	var i18n;
	var useWebChatForm;
	var webChatFormData;
	var i18nDefault = { "en": { 
		"ChatFormSubmitVideo": "Start Video",
		"WebChatTitleVideo": "Video Chat",
		"ChatFormSubmitAudio": "Start Audio",
		"WebChatTitleAudio": "Audio Chat",
		}};
	var form;

	var init = function () {
		var config = window._genesys.widgets.videoengager;
		TENANT_ID = config.tenantId;
		startWithVideo = (config.audioOnly) ? !config.audioOnly : true;
		autoAccept = (config.autoAccept) ? config.autoAccept : true;
		platform = config.platform;
		veUrl = config.veUrl;
		i18n = config.i18n;
		form = config.form;
		enablePrecallForced = config.hasOwnProperty("enablePrecall")
		enablePrecall = config.enablePrecall;
		useWebChatForm = config.useWebChatForm;
		webChatFormData = (config.webChatFormData)?config.webChatFormData: {};
		if (config.callHolder) {
			iframeHolder = document.getElementById(config.callHolder);
			if (!iframeInstance) {
				console.log("iframe holder is passing, but not found: " + config.callHolder);
			}
		}
	};	 

	var startVideoEngager = function() {
		if (interactionId == undefined) {
			interactionId = getGuid();
		}
		if (useWebChatForm) {
			initiateForm();
		} else {
			startWithHiddenChat();
		}

	}

	this.initExtension = function ($, CXBus, Common) {
		console.log("on init extension VideoEngager");
		init();
		oVideoEngager = CXBus.registerPlugin("VideoEngager");
		oVideoEngager.publish("ready"); 
		oVideoEngager.registerCommand("startVideo", function (e) {
			//videochat channel is selected
			console.log("startVideoTriggered");
			startWithVideo = true;
			startVideoEngager();
		});
		
		oVideoEngager.registerCommand("startAudio", function (e) {
			startWithVideo = false;
			startVideoEngager()
		});

		oVideoEngager.registerCommand("startVideoEngager", function (e) {
			startVideoEngager()
		});

		oVideoEngager.registerCommand("endCall", function (e) {
			oVideoEngager.command('WebChatService.endChat');
			closeIframeOrPopup();
		});

		oVideoEngager.subscribe("WebChatService.ended", function(){
			console.log('WebChatService.ended');
			closeIframeOrPopup();
		});			
		
		oVideoEngager.subscribe("WebChatService.started", function(){
			console.log('WebChatService.started');
			if (interactionId != null){
				sendInteractionMessage(interactionId);
			}
			
		});
		
		oVideoEngager.ready();

		window._genesys.widgets.onReady = function(oCXBus) {
			console.log('[CXW] Widget bus has been initialized!');
			oCXBus.command('WebChatService.registerPreProcessor', {preprocessor: function(oMessage){
				if (oMessage.text && oMessage.text.indexOf(veUrl) != -1) { 
					var url = oMessage.text;
					oMessage.html = true;
					oMessage.text = 'Please press button to start video:<br><br><button type="button" class="cx-btn cx-btn-primary i18n" onclick="videoEngager.startVideoEngagerOutbound(\'' + url + '\');">Start video</button>';
					return oMessage;
				}
			}})
			.done(function(e){
				console.log('VE WebChatService.registerPreProcessor');
			})
			.fail(function(e){
				console.error('failed to regsiter preprocessor');
			});
		};

	};

	var initiateForm = function() {
		var webChatOpenData = {
			userData: {veVisitorId:interactionId},
			//prefill values
			form: {/*
				autoSubmit: false,
				firstname: 'John',
				lastname: 'Smith',
				email: 'John@mail.com',
				subject: 'Customer Satisfaction'
				*/
			},
		}
		if (form) {
			webChatOpenData.formJSON = form;
		}

		oVideoEngager.command('WebChat.open', webChatOpenData)
		.done(function (e2) {
			// form opened 
			document.getElementsByClassName("cx-submit")[0].addEventListener("click", function(){
				startVideoChat();					
			})			
			localizeChatForm();
	
		});
	}
	var localizeChatForm = function() {
		var lang = window._genesys.widgets.main.lang;
		if (startWithVideo) {
			var title = i18nDefault["en"].WebChatTitleVideo;
			var submitButton = i18nDefault["en"].ChatFormSubmitVideo;	
		} else {
			var title = i18nDefault["en"].WebChatTitleAudio;
			var submitButton = i18nDefault["en"].ChatFormSubmitAudio;	
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
		document.getElementsByClassName("cx-title")[0].innerHTML = title
		document.getElementsByClassName("cx-submit")[0].innerHTML = submitButton
	}

	this.terminateInteraction = function(){
		closeIframeOrPopup();
		oVideoEngager.command('WebChat.endChat')
		.done(function(e){
			oVideoEngager.command('WebChat.close');
		})
		.fail(function(e){
			//
		});
	}

	var sendInteractionMessage = function(interactionId){
		if (platform == 'purecloud') {
			var message = {interactionId:  interactionId};
			//oVideoEngager.command('WebChatService.sendFilteredMessage',{message:JSON.stringify(message), regex: /[a-zA-Z]/})
			oVideoEngager.command('WebChatService.sendMessage',{message:JSON.stringify(message)})
			.done(function (e) {
				console.log("send message success:" +message);
			})
			.fail(function(e) {
				console.log("fail to send message: "+message);
			});
		}
	}

	var startWithHiddenChat = function() {
		if (!webChatFormData.userData) {
			webChatFormData.userData = {};
		}
		if (!webChatFormData.form) {
			webChatFormData.form = {};
		}

		webChatFormData.form.firstName = webChatFormData.firstname
		webChatFormData.form.lastName = webChatFormData.lastname
		webChatFormData.form.email = webChatFormData.email
		webChatFormData.form.subject = webChatFormData.subject
		webChatFormData.form.message = webChatFormData.message
		webChatFormData.form.nickName = webChatFormData.nickname
		webChatFormData.userData['veVisitorId'] = interactionId
		startVideoChat()
		oVideoEngager.command('WebChatService.startChat', webChatFormData)
			.done(function (e) {
				console.log('WebChatService started Chat');
			}).fail(function (e) {
				console.error("WebChatService failed to start chat: ", e);
				closeIframeOrPopup();
		});
	};

	var getGuid = function () {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000) .toString(16) .substring(1);
		}
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	}


	var startVideoChat = function() {
	
		console.log("InteractionId :", interactionId);
		var left = (screen.width / 2) - (770 / 2);
		var top = (screen.height / 2) - (450 / 2);
		var str = {
			"video_on": startWithVideo, 
			"sessionId": interactionId, 
			"hideChat": true, 
			"type": "initial", 
			"defaultGroup": "floor", 
			"view_widget": "4", 
			"offline": true, 
			"aa": autoAccept, 
			"skip_private": true,
			"inichat": "false"
		};

		var encodedString = window.btoa(JSON.stringify(str));
		var homeURL = veUrl + '/static/';
		var url = homeURL + 'popup.html?tennantId=' + window.btoa(TENANT_ID) + 
			'&params=' + encodedString;
		if (enablePrecallForced && enablePrecall) {
				url+='&pcfl=true'
		} else if (enablePrecallForced && !enablePrecall) {
				url+='&precall=false'
		}
		
		if (!iframeHolder) {
			if (!popupinstance) {
				popupinstance = window.open(url, "popup_instance", "width=770, height=450, left=" + left + ", top=" + top + ", location=no, menubar=no, resizable=yes, scrollbars=no, status=no, titlebar=no, toolbar = no");
			}
			popupinstance.focus();
		} else {
			iframeInstance = document.createElement('iframe');
			iframeInstance.width = "100%"
			iframeInstance.height = "100%"
			iframeInstance.id = "videoengageriframe"
			iframeInstance.allow = "microphone; camera"
			iframeInstance.src = url;
			iframeHolder.insertBefore(iframeInstance, iframeHolder.firstChild);
			iframeHolder.style.display = 'block';
		}	
	};

	this.startVideoEngagerOutbound = function(url) {
		var left = (screen.width/2)-(770/2);
		var top = (screen.height/2)-(450/2);
		if (!popupinstance) {
			popupinstance = window.open(url, "popup_instance", "width=770, height=450, left=" + left + ", top=" + top + ", location=no, menubar=no, resizable=yes, scrollbars=no, status=no, titlebar=no, toolbar = no");
		}
		popupinstance.focus();
	};

	var closeIframeOrPopup = function(){
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
	}	
	

};

var videoEngager = new VideoEngager();
window.videoEngager = videoEngager;

var messageHandler = function (e) {
	console.log('messageHandler', e.data);
	if (e.data.type === 'popupClosed') {
		CXBus.command('VideoEngager.endCall');
	}
	if (e.data.type === 'callEnded') {
		CXBus.command('VideoEngager.endCall');
	}
};

if (window.addEventListener) {
	window.addEventListener("message", messageHandler, false);
} else {
	window.attachEvent("onmessage", messageHandler);
}

//terminate call on page close
window.onbeforeunload = function() {
	videoEngager.terminateInteraction();
}

var eventName = 'VideoEngagerReady';
let event;
if(typeof(Event) === 'function') {
	event = new Event(eventName);
}else{
	event = document.createEvent('Event');
	event.initEvent(eventName, true, true);
}
document.dispatchEvent(event);
