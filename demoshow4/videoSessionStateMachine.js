class VideoSessionStateMachine {
  constructor (options) {
    this.state = 'IDLE';
    this.onSessionStartedCallback = () => {};
    this.onSessionStoppedCallback = () => {};
    this.options = options;
    this.interactionId = null;
    console.log('State_Machine: Initialized with state IDLE');
  }

  onSessionStarted (callback) {
    this.onSessionStartedCallback = callback;
    console.log('State_Machine: onSessionStarted callback registered');
  }

  onSessionStopped (callback) {
    this.onSessionStoppedCallback = callback;
    console.log('State_Machine: onSessionStopped callback registered');
  }

  async onStopSessionRequested (data) {
    console.log('State_Machine: Stopping video session.');
    try {
      await this.options.stopGenesysVideoSession(data.sendMessage);
      this.state = 'MESSENGER_INITIALIZED';
      console.log('State_Machine: Video session stopped. Messenger is now initialized.');
      this.onSessionStoppedCallback();
    } catch (e) {
      console.error('State_Machine: Failed to stop video session:', e);
      this.state = 'VIDEO_SESSION_ACTIVE';
    }
  }

  async handleSignal (signal, data = {}) {
    console.log(`State_Machine: Handling signal '${signal}' in state '${this.state}' with data:`, data);

    const transitions = {
      IDLE: {
        INITIALIZE_MESSENGER_REQUEST: async () => {
          console.log('State_Machine: Messenger initialization requested.');
          this.state = 'MESSENGER_INITIALIZING';
          try {
            await this.options.onMessengerReady();
            this.options.initializeMessenger();
            this.state = 'MESSENGER_INITIALIZED';
            console.log('State_Machine: Messenger initialized successfully.');
          } catch (e) {
            console.error('State_Machine: Failed to initialize messenger:', e);
            this.state = 'IDLE';
          }
        },
        START_SESSION_REQUEST: () => {
          console.error('State_Machine: Cannot start session before messenger is initialized.');
        },
        STOP_SESSION_REQUEST: () => {
          console.warn('State_Machine: No active session to stop.');
        }
      },
      MESSENGER_INITIALIZING: {
        INITIALIZE_MESSENGER_REQUEST: () => {
          console.warn('State_Machine: Messenger is already initializing.');
        },
        START_SESSION_REQUEST: () => {
          console.error('State_Machine: Cannot start session before messenger is initialized.');
        },
        STOP_SESSION_REQUEST: () => {
          console.warn('State_Machine: No active session to stop.');
        }
      },
      MESSENGER_INITIALIZED: {
        START_SESSION_REQUEST: (data) => {
          this.interactionId = data.interactionId;
          this.sendMessage = data.sendMessage !== false;
          this.state = 'WAITING_FOR_PRECONDITION';
          console.log('State_Machine: Waiting for precondition to start video session.');
        },
        INITIALIZE_MESSENGER_REQUEST: () => {
          console.warn('State_Machine: Messenger is already initialized.');
        },
        STOP_SESSION_REQUEST: (data) => {
          if (data?.sendMessage === false) {
            console.log('this message sent by event before video started.');
            return 'disconnectBeforeStart';
          } else {
            this.onStopSessionRequested(data);
          }
        },
        PRECONDITION_FULFILLED: async () => {
          this.state = 'STARTING_VIDEO_SESSION';
          console.log('State_Machine: Precondition fulfilled. Starting video session.');
          try {
            await this.options.sendStartVideoSessionMessage(this.interactionId);
            this.state = 'VIDEO_SESSION_ACTIVE';
            console.log('State_Machine: Video session is now active.');
            this.onSessionStartedCallback();
          } catch (e) {
            console.error('State_Machine: Failed to start video session:', e);
            this.state = 'MESSENGER_INITIALIZED';
          }
        }
      },
      WAITING_FOR_PRECONDITION: {
        PRECONDITION_FULFILLED: async () => {
          this.state = 'STARTING_VIDEO_SESSION';
          console.log('State_Machine: Precondition fulfilled while waiting. Starting video session.');
          try {
            await this.options.sendStartVideoSessionMessage(this.interactionId);
            this.state = 'VIDEO_SESSION_ACTIVE';
            console.log('State_Machine: Video session is now active.');
            this.onSessionStartedCallback();
          } catch (e) {
            console.error('State_Machine: Failed to start video session:', e);
            this.state = 'MESSENGER_INITIALIZED';
          }
        },
        STOP_SESSION_REQUEST: async (data) => {
          this.state = 'STOPPING_VIDEO_SESSION';
          if (data?.sendMessage === false) {
            console.log('this message sent by event before video started.');
            return 'disconnectBeforeStart';
          } else {
            this.onStopSessionRequested(data);
          }
        }
      },
      VIDEO_SESSION_ACTIVE: {
        STOP_SESSION_REQUEST: async (data) => {
          this.state = 'STOPPING_VIDEO_SESSION';
          console.log('State_Machine: Stopping video session.');
          this.onStopSessionRequested(data);
        },
        START_SESSION_REQUEST: () => {
          console.warn('State_Machine: Session is already active.');
        },
        INITIALIZE_MESSENGER_REQUEST: () => {
          console.warn('State_Machine: Cannot initialize messenger during an active session.');
        }
      },
      STOPPING_VIDEO_SESSION: {
        STOP_SESSION_REQUEST: () => {
          console.warn('State_Machine: Already stopping video session.');
        },
        START_SESSION_REQUEST: () => {
          console.warn('State_Machine: Cannot start session while stopping the current session.');
        }
      }
    };

    const stateTransitions = transitions[this.state];
    if (stateTransitions && stateTransitions[signal]) {
      try {
        return await stateTransitions[signal](data);
      } catch (error) {
        console.error('State_Machine: Error during action execution:', error);
      }
    } else {
      console.warn(`State_Machine: Unhandled signal '${signal}' in state '${this.state}'`);
    }
  }
}
