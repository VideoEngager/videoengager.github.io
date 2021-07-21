var popupinstance = null;
var iframeHolder = null;
var iframeInstance;
var oVideoEngager;
var finalUserData = {};
var interactionId;

var startVideoEngager = function(url) {
	var left = (screen.width/2)-(770/2);
	var top = (screen.height/2)-(450/2);
	if (!popupinstance) {
		popupinstance = window.open(url, "popup_instance", "width=770, height=450, left=" + left + ", top=" + top + ", location=no, menubar=no, resizable=yes, scrollbars=no, status=no, titlebar=no, toolbar = no");
	}
	popupinstance.focus();
};

var closeIframeOrPopup = function(){
	if (!iframeHolder) {
		if (popupinstance) {
			popupinstance.close();
		}
		popupinstance = null;
	} else {
		iframeHolder.removeChild(iframeHolder.getElementsByTagName('iframe')[0]);
		iframeHolder.style.display = 'none';
	}
}

var VideoEngager = function () {
	this.init = function (callHolder, platform, tenantId, veUrl, formData, userData, audioOnly, autoAccept, hideChat) {
		var TENANT_ID = tenantId;
		var startWithVideo = (audioOnly) ? !audioOnly : true;
		autoAccept = (autoAccept) ? autoAccept : true;
		hideChat = (hideChat) ? hideChat : true;
		
		if (callHolder) {
			iframeHolder = document.getElementById(callHolder);
			if (!iframeInstance) {
				console.log("iframe holder is passing, but not found: " + callHolder);
			}
		}

		var terminateInteraction = function(){
			//close toaster and terminate the call
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
				var message = '{"interactionId": "'+ interactionId+'", "displayName": "displayName","firstName": "First", "lastName": "Second"}';
				oVideoEngager.command('WebChatService.sendMessage',{message:message})
				.done(function (e) {
					console.log("send message success:" +message);
				})
				.fail(function(e) {
					console.log("fail to send message: "+message);
				});
			}
		}

		var initiateForm = function(){
			var fieldDefinition = {
				wrapper: "<table></table>",
					inputs: [
						{ name: "firstname", maxlength: "100", placeholder: "FirstName", label: "FirstName", autofocus: !0, "aria-required": !0 },
						{ name: "lastname", maxlength: "100", placeholder: "LastName", label: "LastName", "aria-required": !0 },
						{ type: "email", name: "email", maxlength: "100", placeholder: "Email", label: "Email", "aria-required": !0 },
						// to add custom fields to web chat
						{ value:"", name: "customField2", maxlength: "100", placeholder: "Cust", label: "Subject" },
						{ value:"Subject", name: "customField2Label", maxlength: "100", placeholder: "", label: !1, style:"display:none" },
						{ value:"", name: "customField1", maxlength: "100", placeholder: "Test 2", label: "BRAND NEW CUSTOM FIELD" },
						{ value:"BRAND NEW CUSTOM FIELD", name: "customField1Label", maxlength: !1, placeholder: !1, label: !1, style:"display:none"},
					]
			};

			oVideoEngager.command('WebChat.open', {
				userData: {},
				//prefill values
				form: {/*
					autoSubmit: false,
					firstname: 'John',
					lastname: 'Smith',
					email: 'John@mail.com',
					subject: 'Customer Satisfaction'
					*/
				},
				formJSON: fieldDefinition,
				markdown: false
			}).done(function (e2) {
				// form opened 
				document.getElementsByClassName("cx-submit")[0].addEventListener("click", function(){
					startVideoChat();
				})				
			});
		}

		var startVideoChat = function() {
		
			var getGuid = function () {
				function s4() {
					return Math.floor((1 + Math.random()) * 0x10000) .toString(16) .substring(1);
				}
				return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
			}

			if (interactionId == undefined) {
				interactionId = getGuid();
			}

			console.log("InteractionId :", interactionId);
			startWithVideo = startWithVideo.toString();
			var left = (screen.width / 2) - (770 / 2);
			var top = (screen.height / 2) - (450 / 2);
			var str = {
				"video_on": startWithVideo, 
				"sessionId": interactionId, 
				"hideChat": hideChat, 
				"type": "initial", 
				"defaultGroup": "floor", 
				"view_widget": "4", 
				"offline": true, 
				"aa": autoAccept, 
				skip_private: true,
				"inichat": "false"
			};
	
			var encodedString = window.btoa(JSON.stringify(str));
			var homeURL = veUrl + '/static/';
			var url = homeURL + 'popup.html?tennantId=' + window.btoa(TENANT_ID) + '&params=' + encodedString;
			
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

			
			
			window.removeEventListener('message', function (e) {});
			window.addEventListener('message', function (event) {
				if (event.data.type === 'popupClosed') {
					oVideoEngager.command('WebChatService.endChat')
					.done(function (e) {
						console.log('WebChatService.endChat');
					})
					.fail(function (e) {
						console.log('WebChatService.endChat failed');
					});
				}
			});
		};	 

		window._genesys.widgets.onReady = function(oCXBus){
			console.log('[CXW] Widget bus has been initialized!');
			oCXBus.command('WebChatService.registerPreProcessor', {preprocessor: function(oMessage){
				if (oMessage.text && oMessage.text.indexOf(veUrl) != -1) { 
					var url = oMessage.text;
					oMessage.html = true;
					oMessage.text = 'Please press button to start video:<br><br><button type="button" class="cx-btn cx-btn-primary i18n" onclick="startVideoEngager(\'' + url + '\');">Start video</button>';
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

		window._genesys.cxwidget = window._genesys.widgets;
		if (!window._genesys.widgets.extensions) {
			window._genesys.widgets.extensions = {};
		}

		window._genesys.widgets.extensions["VideoEngager"] = function ($, CXBus, Common) {
			console.log("on init extension VideoEngager");
			oVideoEngager = CXBus.registerPlugin("VideoEngager");
			oVideoEngager.publish("ready"); 
			
			oVideoEngager.registerCommand("startVideo", function (e) {
				//videochat channel is selected
				console.log("startVideoTriggered");
				startWithVideo = true;

				//set language to change form language for videoengagar video chat
				var default_lang = window._genesys.widgets.main.lang;
				oVideoEngager.command('App.setLanguage', {lang: default_lang + "_videochat"})
				.done(function(e){
					// App set language successfully started
					initiateForm();
				})
				.fail(function(e){
					// App failed to set language
				});
			});
			
			oVideoEngager.registerCommand("endCall", function (e) {
				oVideoEngager.command('WebChatService.endChat');
				closeIframeOrPopup();
			});

			oVideoEngager.registerCommand("startAudio", function (e) {
				startWithVideo = false;var default_lang = window._genesys.widgets.main.lang;
				oVideoEngager.command('App.setLanguage', {lang: default_lang + "_videochat"})
				.done(function(e){
					initiateForm();
				});
			});
			
			oVideoEngager.subscribe("WebChatService.ended", function(){
				console.log('WebChatService.ended');
				closeIframeOrPopup();
			});			
			
			oVideoEngager.subscribe("WebChatService.started", function(){
				console.log('WebChatService.started');
				sendInteractionMessage(interactionId);
			});
			
			oVideoEngager.ready();

			//terminate call on page close
			window.onbeforeunload = function(){
				terminateInteraction();
			}
		};
		
		var messageHandler = function (e) {
			console.log('messageHandler', e.data);
			if (e.data.type === 'popupClosed') {
				terminateInteraction();
			}
			if (e.data.type === 'callEnded') {
				terminateInteraction();
			}
		};
		
		if (window.addEventListener) {
			window.addEventListener("message", messageHandler, false);
		} else {
			window.attachEvent("onmessage", messageHandler);
		}
	
	};
};

var videoengager = new VideoEngager();
window.videoengager = videoengager;

var eventName = 'VideoEngagerReady';
let event;
if(typeof(Event) === 'function') {
	event = new Event(eventName);
}else{
	event = document.createEvent('Event');
	event.initEvent(eventName, true, true);
}
document.dispatchEvent(event);
