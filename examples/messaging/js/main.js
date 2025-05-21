// src/main.js
import { testConfig } from './config.js';
import { VideoEngagerClient } from './client.js';

const btnInit      = document.getElementById('initSdk');
const btnStartC    = document.getElementById('startChat');
const btnEndC      = document.getElementById('endChat');
const btnStartV    = document.getElementById('startVideo');
const btnEndV      = document.getElementById('endVideo');
const videoDiv     = document.getElementById('video-call-ui');
const logEl        = document.getElementById('log');

let state = 'idle'; // 'idle' | 'chat' | 'video'
let client;

// simple logger
function log(msg) {
  const ts = new Date().toLocaleTimeString();
  logEl.textContent += `[${ts}] ${msg}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

function setState(s) {
  state = s;
  btnStartC.disabled = (s !== 'idle');
  btnEndC.disabled   = (s !== 'chat');
  btnStartV.disabled = (s !== 'idle');
  btnEndV.disabled   = (s !== 'video');
  videoDiv.hidden    = (s !== 'video');
}

async function main() {
  btnInit.addEventListener('click', async () => {
    log('Initializing SDK…');
    client = new VideoEngagerClient(testConfig);
    try {
      await client.init();
      log('SDK Ready');
      setState('idle');

      // mirror SDK events
      client.on('GenesysMessenger.conversationStarted', () => log('Chat started'));
      client.on('GenesysMessenger.conversationEnded',   () => {
        log('Chat ended');
        setState('idle');
      });
      client.on('VideoEngagerCall.started', () => log('Video started'));
      client.on('VideoEngagerCall.ended',   () => {
        log('Video ended');
        setState('idle');
      });

      btnStartC.disabled = false;
      btnStartV.disabled = false;
    } catch (err) {
      log(`Init error: ${err.message}`);
    }
  });

  btnStartC.addEventListener('click', async () => {
    log('Calling startChat()…');
    try {
      await client.startChat();
      setState('chat');
    } catch (err) {
      log(`startChat error: ${err.message}`);
    }
  });

  btnEndC.addEventListener('click', async () => {
    log('Calling endChat()…');
    try {
      await client.endChat();
      setState('idle');
    } catch (err) {
      log(`endChat error: ${err.message}`);
    }
  });

  btnStartV.addEventListener('click', async () => {
    log('Calling startVideo()…');
    try {
      await client.startVideo();
      setState('video');
    } catch (err) {
      log(`startVideo error: ${err.message}`);
    }
  });

  btnEndV.addEventListener('click', async () => {
    log('Calling endVideo()…');
    try {
      await client.endVideo();
      setState('idle');
    } catch (err) {
      log(`endVideo error: ${err.message}`);
    }
  });
}

// run it
main();
