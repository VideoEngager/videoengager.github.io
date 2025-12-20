const css = `#mediaApp {
      font-family: system-ui, sans-serif;
      margin: 20px;
      max-width: 800px;
    }

    #mediaApp h2 {
      margin-bottom: 12px;
    }

    #mediaApp .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      margin: 10px 0 16px;
    }

    #mediaApp label {
      font-size: 14px;
    }

    #mediaApp select {
      padding: 4px 8px;
      font-size: 14px;
    }

    #mediaApp button {
      padding: 6px 14px;
      font-size: 14px;
      cursor: pointer;
      margin-bottom: 8px;
    }

    #mediaApp video {
      width: 100%;
      max-width: 640px;
      background: #000;
      border-radius: 8px;
      display: block;
    }
`;
// Inject styles
if (!document.getElementById('mediaAppStyles')) {
  const style = document.createElement('style');
  style.id = 'mediaAppStyles';
  style.textContent = css;
  document.head.appendChild(style);
}
const startButton = document.getElementById('startButton');
const cameraSelect = document.getElementById('cameraSelect');
const micSelect = document.getElementById('micSelect');
const preview = document.getElementById('preview');

let currentStream = null;

// Start flow on button click (required by some browsers for permissions)
startButton.addEventListener('click', async () => {
  try {
    // Initial stream just to get permissions and default devices
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    handleStream(stream);
    await loadDevices(); // fill selects
  } catch (err) {
    console.error('Error accessing media devices:', err);
    alert('Could not access camera/microphone. Check permissions and try again.');
  }
});

// When device selection changes -> get new stream with selected devices
cameraSelect.addEventListener('change', () => switchStream());
micSelect.addEventListener('change', () => switchStream());

async function loadDevices () {
  const devices = await navigator.mediaDevices.enumerateDevices();

  const videoDevices = devices.filter(d => d.kind === 'videoinput');
  const audioDevices = devices.filter(d => d.kind === 'audioinput');

  // Clear current options
  cameraSelect.innerHTML = '';
  micSelect.innerHTML = '';

  // Populate cameras
  videoDevices.forEach((device, index) => {
    const option = document.createElement('option');
    option.value = device.deviceId;
    option.text =
          device.label || `Camera ${index + 1}`;
    cameraSelect.appendChild(option);
  });

  // Populate mics
  audioDevices.forEach((device, index) => {
    const option = document.createElement('option');
    option.value = device.deviceId;
    option.text =
          device.label || `Microphone ${index + 1}`;
    micSelect.appendChild(option);
  });
}
function debounce (fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}
async function switchStream () {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Your browser does not support getUserMedia.');
    return;
  }

  // Stop old tracks
  if (currentStream) {
    currentStream.getTracks().forEach(t => t.stop());
  }

  const videoDeviceId = cameraSelect.value;
  const audioDeviceId = micSelect.value;

  const constraints = {
    video: videoDeviceId
      ? { deviceId: { exact: videoDeviceId } }
      : true,
    audio: audioDeviceId
      ? { deviceId: { exact: audioDeviceId } }
      : true
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleStream(stream);
  } catch (err) {
    console.error('Error switching devices:', err);
    alert('Could not switch to selected devices.');
  }
}

function handleStream (stream) {
  currentStream = stream;
  preview.srcObject = stream;
  preview.muted = true; // avoid echo in preview
}
