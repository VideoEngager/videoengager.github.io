'use strict';

const { browser } = require("protractor");
const axios = require('axios');

var sessionId;
var iframeElement;
var data;
var browser2;
var withoutIframe;

describe('single page demo', function() {

  beforeEach(function() {
    browser.ignoreSynchronization = true;
    browser.waitForAngularEnabled(false);
  });
  
  var impersonateCreate = function () {
    var url = "https://videome.leadsecure.com/api/partners/impersonateCreate" 
    return axios.post(url ,{
      pak: "9be78bc5-a721-9a9b-81a5-87858ddd0bb4",
      email: "c4b553c3-ee42-4846-aeb1-f0da3d85058eslav@videoengager.com",
      organizationId: "c4b553c3-ee42-4846-aeb1-f0da3d85058e",
    });
	}

  var isPrecall = function(browser) {
      return browser.driver
        .findElement(by.id("videoPreview"))
        .then(function(element){
          return true;
        }, function(err) {
          //console.log(err)
          return false;
      }); 
  };

  var joinCall = function(browser) {
    return browser.driver
      .findElement(by.id("joinConferenceButton"))
      .then(function(joinConferenceButton){
        return true;
      }, function(err) {
        //console.log(err)
        return false;
    }); 
};
 

var callEstablished = function(browser) {
  return browser.driver
    .findElement(by.id("remoteVideo"))
    .then(function(remoteVideo){
      return true;
    }, function(err) {
      //console.log(err)
      return false;
  }); 
};

var iframeCreated = function(browser) {
  return browser.driver.findElement(by.id("videoengageriframe"))
    .then( function(element){
      iframeElement = element;
      return iframeElement.getAttribute('src');
    }, function(err) {
      return false;
    })
    .then(function(iframeUrl){
      sessionId = JSON.parse(Buffer.from(iframeUrl.split("&")[1].toString().substring(7), 'base64').toString() )["sessionId"];
      return true;
    }); 
};


var clickAgentRedButton = function(browser) {
  console.log("wait 10 sec for connection establishment");
  browser.driver.sleep(10000);

  return browser.driver
    .executeScript(`document.querySelector('#hangupButton').click();`)
    .then(function(res){
      return true;
    }, function(err) {
      return false;
  }); 
};



var confirmAgentDialog = function(browser) {
  return browser.driver 
    .findElement(by.xpath("/html/body/div[17]/div[3]/div/button[1]"))
    .then(function(confirmButton){
      confirmButton.click();
      return true;
    }, function(err) {
      //console.log(err)
      return false;
  }); 
};

  //single page demo
  it('should open precall in single button demo page', async function() {
    var url = 'http://localhost:3000/single-button-genesys-demo.html';
    browser.driver.get(url)
    .then(function(){
      browser.driver.manage().window().maximize();
      return browser.driver.executeScript("CXBus.command('VideoEngager.startVideoEngager')")
    })
    .then(function(){
      return browser.driver.wait(iframeCreated(browser), 3000);
    })
    .then(function(){
      withoutIframe = browser;
      return browser.switchTo().frame(iframeElement);
    })
    .then(function(){
      return browser.driver.wait(isPrecall(browser), 3000);
    })
    .then(function(){
      return browser.driver.wait(joinCall(browser), 3000);  
    })
    .then(function(){
      return impersonateCreate()
    })
    .then(async function  (res) {
      data = res;
      browser2 = await browser.forkNewDriverInstance();
      browser2.driver.manage().window().maximize();

      return browser2.waitForAngularEnabled(false);
    })
    .then(function(){
      browser2.ignoreSynchronization = true
      var url2 = "https://videome.leadsecure.com/static/agent.popup.cloud.html"+
      "?params=eyJsb2NhbGUiOiJlbl9VUyJ9"+
      "&interaction=1" + 
      "&token="+ data.data.token +
      "&sk=true"+
      "&isPopup=false"+
      "&invitationId=" + sessionId;
      browser2.get(url2);
      return browser.driver.executeScript(`return (document.getElementById('joinConferenceButton') == null)`);
    })
    .then(async function (res) {
      if(res){
        console.log("precall not enabled");
        return browser2.driver.wait(callEstablished(browser2), 5000);
      } else {
        console.log("precall enabled");
        await browser.driver.executeScript(`document.getElementById('joinConferenceButton').click(); `);
        return browser2.driver.wait(callEstablished(browser2), 5000);
      }
    })
    .then(function (res) {
      console.log("verifying customer page video streams.");
      return browser2.wait( function() {
        return browser2.driver.executeScript(
          "return (window.document.querySelector('#remoteVideo') && (window.document.querySelector('#remoteVideo') != null) && (window.document.querySelector('#localVideo') && (window.document.querySelector('#localVideo') != null)))")
        .then(async function(result) {
          if (result){
            console.log("customer page video verificiation succeed");
            return true;
          } 
          return false;
        } , function(err) {
          return false;
        }); 
      }, 15000);
    })  
    .then(function (res) {
      // verify visitor page video - should connect in 15 sec
      console.log("verifying agent page video streams.");
      return browser.wait( function() {
        return browser.driver.executeScript(
          "return (window.document.querySelector('.sourcevideo') && (window.document.querySelector('.sourcevideo') != null) && (window.document.querySelector('.localvideo') && (window.document.querySelector('.localvideo') != null)))")
        .then(function(result) {
          if (result){
            console.log("agent page video verificiation succeed");
            return true;
          } 
          return false;
        } , function(err) {
          return false;
        }); 
      }, 15000);
    })
    .then(function () {
      //terminate agent page
      console.log("terminate session by closing agent page");
      return browser2.driver.wait(clickAgentRedButton(browser2),16000);
    })
    .then(function () {
      return browser2.driver.wait(confirmAgentDialog(browser2), 30000)
    })
    .then(function () {
      //verify initial state in agent
      return browser2.driver.wait(isPrecall(browser2), 3000);  
    })
    .then(function (res) {

      return browser.driver.wait(browser.switchTo().defaultContent(), 3000); 
    })
    .then(function (res) {
    //check any ifame in visitor page
    return browser.wait(async function() {
        return await browser.driver.executeScript(
          "return (window.document.querySelector('iframe') == null)")
        .then(function(result) {
          if (result === true){
            console.log("iframe removed in single button page after session termination");
            return true;
          } 
          return false;
        } , function(err) {
          return false;
        }); 
      }, 15000);
    })
    .then(function () {
      console.log("done");
    })
    
  
  });
});
