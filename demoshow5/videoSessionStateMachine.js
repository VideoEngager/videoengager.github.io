class VideoSessionStateMachine {
  constructor ({ onSessionStartedCallback, onSessionStoppedCallback, startVideoCallback, stopVideoCallback }) {
    this.state = 'IDLE';
    this.onSessionStartedCallback = onSessionStartedCallback || (() => {});
    this.onSessionStoppedCallback = onSessionStoppedCallback || (() => {});
    this.startVideoCallback = startVideoCallback;
    this.stopVideoCallback = stopVideoCallback;
    this.interactionId = null;
    console.log('State_Machine: Initialized with state IDLE');
  }

  onStopSessionRequested (data) {
    console.log('State_Machine: Stopping video session.');

    if (typeof this.stopVideoCallback !== 'function') {
      console.error('State_Machine: stopVideoCallback is not a function!');
    }

    this.stopVideoCallback(data.sendMessage)
      .then(result => {
        this.onSessionStoppedCallback(result);
      }).catch(error => {
        console.error('State_Machine: Error in promise:', error);
      });

    this.state = 'MESSENGER_INITIALIZED';
    console.log('State_Machine: Video session stopped. Messenger is now initialized.');
  }

  async signal (signal, data = {}) {
    console.log(`State_Machine: Handling signal '${signal}' in state '${this.state}' with data:`, data);

    const transitions = {
      IDLE: {
        START_SESSION_REQUEST: (data) => {
          if (data?.interactionId) {
            this.interactionId = data?.interactionId;
          }
        },
        STOP_SESSION_REQUEST: () => {
          // Do nothing, state should remain IDLE
        },
        MESSENGER_INITIALIZED: () => {
          if (this?.interactionId) {
            this.startVideoCallback(this.interactionId)
              .then(result => {
                this.onSessionStartedCallback(result);
                this.state = 'VIDEO_SESSION_ACTIVE';
              })
              .catch(error => {
                console.error('State_Machine: Error in promise:', error);
              });
          } else {
            this.state = 'MESSENGER_INITIALIZED';
          }
        }
      },
      MESSENGER_INITIALIZED: {
        START_SESSION_REQUEST: (data) => {
          if (data?.interactionId) {
            this.interactionId = data?.interactionId;
          }

          this.startVideoCallback(this.interactionId)
            .then(result => {
              this.onSessionStartedCallback(result);
              this.state = 'VIDEO_SESSION_ACTIVE';
            })
            .catch(error => {
              console.error('State_Machine: Error in promise:', error);
              // Ensure state stays in MESSENGER_INITIALIZED in case of error
            });
        },
        STOP_SESSION_REQUEST: (data) => {
          if (data?.sendMessage === false) {
            console.log('State_Machine: This message sent by event before video started.');
          } else {
            this.onStopSessionRequested(data);
          }
        }
      },
      VIDEO_SESSION_ACTIVE: {
        STOP_SESSION_REQUEST: async (data) => {
          this.state = 'STOPPING_VIDEO_SESSION';
          this.onStopSessionRequested(data);
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

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = VideoSessionStateMachine;
}
