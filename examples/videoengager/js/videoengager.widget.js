

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

	var httpRequest = function (url, jsonParam, HTTPRequestType, authToken,callback, failcallback) {
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open(HTTPRequestType, url);
		xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xmlhttp.setRequestHeader("authorization", "Bearer " + authToken);
		xmlhttp.onerror = function(){
			failcallback(xmlhttp);
		}
		xmlhttp.onload = function(){
			if (xmlhttp.readyState === 4){
				callback(JSON.parse(xmlhttp.responseText))
			}
		};
		xmlhttp.send(JSON.stringify(jsonParam));
	}

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

	var startCalendar = function() {
		oVideoEngager.command('Calendar.generate')
		.done(function(e){
			console.log(e);
		})
		.fail(function(e){
			console.error("Calendar failed  : ", e);
		});
/*
		oMyPlugin.command('Calendar.showAvailability', {date: '03/22/17'}).done(function(e){

			// Calendar showed availability successfully
		
		}).fail(function(e){
		
			// Calendar failed to show availability
		});
		*/
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

		oVideoEngager.registerCommand("startCalendar", function (e) {
			startCalendar()
		});

		oVideoEngager.subscribe('Callback.opened', function(e){
			var AuthToken = null;
			var date = null;

			//authenticate
			var authURL = "api/partners/impersonateCreate";
	    
			var servers = {
				dev: {
					veUrl: "https://dev.videoengager.com/",
					tenantId : "test_tenant",
					dataURL: 'https://api.mypurecloud.com.au',
					deploymentKey: 'c2eaaa5c-d755-4e51-9136-b5ee86b92af3',
					orgGuid: '327d10eb-0826-42cd-89b1-353ec67d33f8',
					queue: "video",
					pak: "DEV2",
					email: "327d10eb-0826-42cd-89b1-353ec67d33f8slav@videoengager.com",
					organizationId:"327d10eb-0826-42cd-89b1-353ec67d33f8" 
				},
				prod: {
					veUrl: "https://videome.leadsecure.com/",
					tenantId : "0FphTk091nt7G1W7",
					dataURL: 'https://api.mypurecloud.com',
					deploymentKey: '973f8326-c601-40c6-82ce-b87e6dafef1c',
					orgGuid: 'c4b553c3-ee42-4846-aeb1-f0da3d85058e',
					queue: "Support"
				},
				staging: {
					veUrl: "https://staging.videoengager.com/",
					tenantId : "oIiTR2XQIkb7p0ub",
					dataURL: 'https://api.mypurecloud.de',
					deploymentKey: '1b4b1124-b51c-4c38-899f-3a90066c76cf',
					orgGuid: '639292ca-14a2-400b-8670-1f545d8aa860',
					queue: "Support"
				}
			};
			var server = "dev";
			httpRequest(servers[server].veUrl + authURL, {pak: servers[server].pak, email: servers[server].email, organizationId: servers[server].organizationId},"POST", null, function(data){
				AuthToken = data.token;;
			}, function(xmlhttp){
				debugger;

				oVideoEngager.command('Callback.showOverlay', {

					html: '<div>Something Went Wrong</div>'
				
				})
			});

			oVideoEngager.subscribe('Calendar.selectedDateTime', function(e){
				date = e.data.date;
			});

			// to prevent onClose user confirmation dialog, remove events in inputs
			document.querySelectorAll("input,textarea").forEach((e) => {
				var new_element = e.cloneNode(true);
				e.parentNode.replaceChild(new_element, e);
			});

			// to handle confirm button
			var old_element = document.querySelector(".cx-callback-confirm");
			var new_element = old_element.cloneNode(true);
			old_element.parentNode.replaceChild(new_element, old_element);
			new_element.addEventListener("click", function(e) {
				e.preventDefault();
				if (!date){
					date =  new Date();
				}
				var url = servers[server].veUrl + "api/schedules/my?sendNotificationEmail"
				var json =  
					{"pin":"3936",
					"date":date.getTime(),
					"duration":30,
					"pak":"b7abeb05-f821-cff8-0b27-77232116bf1d",
					"visitor":{
						"name":document.querySelector("#cx_form_callback_firstname").value,
						"lastname":document.querySelector("#cx_form_callback_lastname").value,
						"phone":document.querySelector("#cx_form_callback_phone_number").value,
						"autoAnswer":true}
					};

				httpRequest(url, json,"POST", AuthToken, function(dataEmail){
					var scheduleUrl = servers[server].veUrl+"api/schedules/my/";
					if (date){
						scheduleUrl += date.getTime()
						scheduleUrl += "/"
						scheduleUrl += (date.getTime() + ( 30 * 60 * 1000)) // add 30 min
					}
					httpRequest(scheduleUrl, null,"GET", AuthToken, function(dataSchedule){

						//send callback
						var callbackURl = "http://localhost:9000/api/genesys/callback"
						var callbackJSON ={
							callbackUserName: document.querySelector("#cx_form_callback_firstname").value,
							customDataAttribute: "custom",
							veUrl: dataSchedule[0].agent.meetingUrl,
							callerId: document.querySelector("#cx_form_callback_phone_number").value,
							callerIdName: document.querySelector("#cx_form_callback_firstname").value,
							callbackScheduledTime: date.toISOString(),
							tenantId: TENANT_ID
						};
						httpRequest(callbackURl, callbackJSON, "POST", AuthToken, function(data){

							oVideoEngager.command('Callback.showOverlay', {

								html: '<div>Your Meeting is set </div><div><a href="'+dataSchedule[0].visitor.meetingUrl+'">click</a></div>'
							
							}).done(function(){
			
							});

						},function(xmlhttp){
							debugger;
		
					 
						});

					}, function(xmlhttp){
						debugger;
	
				 
					});
					
				}, function(xmlhttp){
					debugger;

			 
				});
			});
		})

 
		/*
		oVideoEngager.subscribe('Calendar.generated', function(e){
			oVideoEngager.command('Toaster.open', {
				type: 'generic',
				title: 'Toaster Title',
				body: e.data.ndCalendar[0],
				icon: 'chat',
				controls: 'close',
				immutable: true, 
			}).done(function(e){
				document.querySelectorAll(".cx-footer").forEach((e) => {
					e.style.display = 'none';
				});
				// Toaster opened successfully
			}).fail(function(e){
				// Toaster failed to open properly
			});
		});
		*/

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
