var popupinstance;
var iframeInstance;
var startVideoEngager = function(url) {
	var left = (screen.width/2)-(770/2);
	var top = (screen.height/2)-(450/2);
	if (!popupinstance) {
		popupinstance = window.open(url, "popup_instance", "width=770, height=450, left=" + left + ", top=" + top + ", location=no, menubar=no, resizable=yes, scrollbars=no, status=no, titlebar=no, toolbar = no");
	}
	popupinstance.focus();
};

var VideoEngager = function () {
	this.init = function (callHolder, platform, tenantId, veUrl, formData, userData, audioOnly, autoAccept, hideChat) {
		var TENANT_ID = tenantId;
		var startWithVideo = (audioOnly) ? !audioOnly : true;
		autoAccept = (autoAccept) ? autoAccept : true;
		hideChat = (hideChat) ? hideChat : true;
		var iframeHolder = null;
		if (callHolder) {
			iframeHolder = document.getElementById(callHolder);
			if (!iframeInstance) {
				console.log("iframe holder is passing, but not found: " + callHolder);
			}
		}
		var firstName = (formData.firstName) ? formData.firstName : '';
		var lastName = (formData.lastName) ? formData.lastName : '';
		var autoSubmit = (formData.autoSubmit) ? formData.autoSubmit : false;
		var email = (formData.email) ? formData.email : '';
		var message = (formData.message) ? formData.message : '';
		var subject = (formData.subject) ? formData.subject : '';
		var form = formData;
		var oVideoEngager;
		window._genesys.widgets.onReady = function(oCXBus){

			console.log('[CXW] Widget bus has been initialized!');
			var oWCC = oCXBus;
			oCXBus.command('WebChatService.registerPreProcessor', {preprocessor: function(oMessage){

				if (oMessage.text && oMessage.text.indexOf(veUrl) != -1) { 
					var url = oMessage.text;
					oMessage.html = true;
					oMessage.text = 'Please press button to start video:<br><br><button type="button" class="cx-btn cx-btn-primary i18n" onclick="startVideoEngager(\'' + url + '\');">Start video</button>';
					
					return oMessage;
				}
			}}
			).done(function(e){
				console.log('VE WebChatService.registerPreProcessor');
			}).fail(function(e){
				console.log('failed to regsiter preprocessor');
			});
		};
			

		window._genesys.cxwidget = window._genesys.widgets;
		if (!window._genesys.widgets.extensions) {
			window._genesys.widgets.extensions = {};
		}

		window._genesys.widgets.extensions["VideoEngager"] = function ($, CXBus, Common) {
			console.log("on init extension VideoEngager");
			oVideoEngager = CXBus.registerPlugin("VideoEngager");
			oVideoEngager.registerCommand("VideoEngagerStartVideo", function(e){
				console.log('VideoEngagerStartVideo registered' );
			});
		
			oVideoEngager.publish("ready");
			//oVideoEngager.republish("ready");
			oVideoEngager.subscribe("Callback.opened", function(){
				console.log('custom Callback.opened');
			});
			
			oVideoEngager.subscribe("WebChat.opened", function(){
				console.log('custom WebChat.opened');
			});					
			
			oVideoEngager.subscribe("SendMessage.opened", function(){
				console.log('custom SendMessage.opened');

			});	
			
			var videoEngagerChat = function () {
				var channelType = (startWithVideo) ? 'Video' : 'Audio'; 
				var buttonHtml = 'videoengager/html/button' + channelType + '.html';
				if (firstName && lastName) {
					buttonHtml = 'videoengager/html/buttonBlank' + channelType + '.html';
				}
				
				var startVideoChat = function() {
				
					var getGuid = function () {
						function s4() {
							return Math.floor((1 + Math.random()) * 0x10000)
									.toString(16)
									.substring(1);
						}
						return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
								s4() + '-' + s4() + s4() + s4();
					}

					var getCookie = function (name) {
						var pattern = RegExp(name + "=.[^;]*");
						var matched = document.cookie.match(pattern);
						if (matched) {
							var cookie = matched[0].split('=');
							var cooki = decodeURIComponent(cookie[1]).replace(/"/g, "");
							return cooki;
						}
						return null;
					};

					var setCookie = function (name, value, hour) {
						var cookieName = name;
						var cookieValue = value;
						var d = new Date();
						var time = d.getTime();
						var expireTime = time + 1000 * 60 * 60 * parseInt(hour);
						d.setTime(expireTime);
						if (hour) {
							document.cookie = cookieName + "=" + cookieValue + ";expires=" + d.toGMTString() + ";path=/";
						} else {
							document.cookie = cookieName + "=" + cookieValue + ";path=/";
						}
					}

					var interactionId;// = getCookie('interactionId');
					if (interactionId == undefined) {
						interactionId = getGuid();
						setCookie('interactionId', interactionId, 24);
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
					
					var finalUserData = {};
					if (userData) {
						for (var key in userData) { 
							finalUserData[key] = userData[key]; 
						}
					}
					finalUserData['veVisitorId'] = interactionId;
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
					oVideoEngager.command('WebChatService.startChat', {
						userData: finalUserData,
						autoSubmit: autoSubmit,
						nickname: firstName + ' ' + lastName,
						firstname: firstName,
						lastname: lastName,
						email: email,
						subject: subject,
						message: message,
						form: {
							firstName:firstName,
							lastName: lastName,
							email: email,
							message: message
						},

					}).done(function (e) {
						console.log('WebChatService.startChat');
						if (platform == 'purecloud') {
							var message = '{"interactionId": "'+ interactionId+'", "displayName": "displayName","firstName": "First", "lastName": "Second"}';
							oVideoEngager.command('WebChatService.sendMessage',{message:message})
							.done(function (e) {
								console.log("send message success:" +message);
							}).fail(function(e) {
								console.log("fail to send message: "+message);
							});
						}
						window._genesys.cxwidget.bus.command("Toaster.close");
						oVideoEngager.subscribe("WebChatService.agentConnected", function (e) {
							console.log('WebChatService.agentConnected');

							/*
							 if (e.data && e.data.agents) {
							 var agent = e.data.agents[2];
							 console.log('agent name', agent.name);
							 popup_instance.postMessage ({type: 'startVideo', callto: agent.name}, '*');
							 }
							 */
						});
						window.removeEventListener('message', function (e) {});
						window.addEventListener('message', function (event) {
							if (event.data.type === 'popupClosed') {
								oVideoEngager.command('WebChatService.endChat').done(function (e) {
									console.log('WebChatService.endChat');
								}).fail(function (e) {
									console.log('WebChatService.endChat failed');
								});
							}
						});

					}).fail(function (e) {
						console.error("WebChatService failed to start chat: ", e);
						if (!iframeHolder) {
							if (popupinstance) {
								popupinstance.close();
								popupinstance = null;
							}
						} else {
							iframeHolder.removeChild(iframeHolder.getElementsByTagName('iframe')[0]);
							iframeHolder.style.display = 'none';
						}
						window.alert("Chat Channel is not available!!!");

					});
				
				};
				
				if (autoSubmit) {
					startVideoChat();
				} else {
				
					$.get(buttonHtml, function (body_data) {
						var oConnectingView = {
							type: "generic",
							title: channelType + " Chat",
							body: body_data,
							icon: (startWithVideo) ? "videochat" : "call-outgoing",
							controls: "close",
							buttons: {
								type: "binary",
								primary: "Start " + channelType,
								secondary: "Cancel"
							}
						};
						window._genesys.cxwidget.bus.command("Toaster.open", oConnectingView).done(function (e2) {
							$(e2.html).find(".cx-btn.cx-btn-default").click(function () {
								window._genesys.cxwidget.bus.command("Toaster.close");
							});
							$(e2.html).find(".cx-btn.cx-btn-primary").click(function () {
								if (!firstName && !lastName) {
									firstName = $('#cx_webchat_form_firstname_f1').val();
									lastName = $('#cx_webchat_form_lastname_f1').val();
									email = $('#cx_webchat_form_email_f1').val();
									message = $('#cx_webchat_form_subject_f1').val();
								}
								startVideoChat();
							});
							
						});
						
						
					});
				}
			};
			
			oVideoEngager.registerCommand("startVideo", function (e) {
				startWithVideo = true;
				videoEngagerChat();
			});
			
			oVideoEngager.registerCommand("endCall", function (e) {
				window._genesys.cxwidget.bus.command("Toaster.close");
				oVideoEngager.command('WebChatService.endChat');

				if (!iframeHolder) {
					if (popupinstance) {
						popupinstance.close();
					}
					popupinstance = null;
				} else {
					iframeHolder.removeChild(iframeHolder.getElementsByTagName('iframe')[0]);
					iframeHolder.style.display = 'none';
				}
			});

			oVideoEngager.registerCommand("startAudio", function (e) {
				startWithVideo = false;
				videoEngagerChat();
			});
			
			oVideoEngager.subscribe("WebChatService.ended", function(){
				console.log('WebChatService.ended');
				if (!iframeHolder) {
					if (popupinstance) {
						popupinstance.close();
					}
					popupinstance = null;
				} else {
					iframeHolder.removeChild(iframeHolder.getElementsByTagName('iframe')[0]);
					iframeHolder.style.display = 'none';
				}

				window._genesys.cxwidget.bus.command("Toaster.close");
			});			
			
			
			oVideoEngager.subscribe("WebChatService.messageReceived", function(msg){
				console.log('custom WebChatService.messageReceived', msg);
			});
			
			oVideoEngager.subscribe("SendMessage.opened", function(){
				console.log('custom SendMessage.opened');
			});				

			oVideoEngager.subscribe("SendMessageService.messageSent", function(e){
				console.log('SendMessageService.messageSent', e);
			});
			
			oVideoEngager.subscribe("WebChatService.started", function(){
				console.log('WebChatService.started');
			});
			oVideoEngager.ready();
		};

		
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