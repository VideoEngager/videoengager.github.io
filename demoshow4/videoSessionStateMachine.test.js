/* globals describe beforeEach jest test afterEach expect */
const VideoSessionStateMachine = require('./VideoSessionStateMachine');

describe('VideoSessionStateMachine', () => {
  let stateMachine;
  let options;
  let onSessionStarted;
  let onSessionStopped;

  beforeEach(() => {
    onSessionStarted = jest.fn();
    onSessionStopped = jest.fn();
    options = {
      stopGenesysVideoSession: jest.fn(),
      onMessengerReady: jest.fn(),
      initializeMessenger: jest.fn(),
      sendStartVideoSessionMessage: jest.fn()
    };
    stateMachine = new VideoSessionStateMachine(options);
    stateMachine.onSessionStarted(onSessionStarted);
    stateMachine.onSessionStopped(onSessionStopped);

    // Mock console methods to suppress logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('initial state should be IDLE', () => {
    expect(stateMachine.state).toBe('IDLE');
  });

  test('initialize messenger successfully', async () => {
    await stateMachine.handleSignal('INITIALIZE_MESSENGER_REQUEST');
    expect(stateMachine.state).toBe('MESSENGER_INITIALIZED');
    expect(options.onMessengerReady).toHaveBeenCalled();
    expect(options.initializeMessenger).toHaveBeenCalled();
  });

  test('start session without initializing messenger should fail', async () => {
    await stateMachine.handleSignal('START_SESSION_REQUEST', { interactionId: '123' });
    expect(stateMachine.state).toBe('IDLE');
  });

  test('full session lifecycle', async () => {
    await stateMachine.handleSignal('INITIALIZE_MESSENGER_REQUEST');
    await stateMachine.handleSignal('START_SESSION_REQUEST', { interactionId: '123' });
    expect(stateMachine.state).toBe('WAITING_FOR_PRECONDITION');
    await stateMachine.handleSignal('PRECONDITION_FULFILLED');
    expect(stateMachine.state).toBe('VIDEO_SESSION_ACTIVE');
    expect(onSessionStarted).toHaveBeenCalled();
    await stateMachine.handleSignal('STOP_SESSION_REQUEST');
    expect(stateMachine.state).toBe('MESSENGER_INITIALIZED');
    expect(options.stopGenesysVideoSession).toHaveBeenCalled();
    expect(onSessionStopped).toHaveBeenCalled();
  });

  test('stop session before starting should not disconnect', async () => {
    stateMachine.handleSignal('STOP_SESSION_REQUEST', { sendMessage: false });
    expect(stateMachine.state).toBe('IDLE');
    expect(onSessionStopped).not.toHaveBeenCalled();
  });

  test('stop session after initializing messenger but before starting session', async () => {
    await stateMachine.handleSignal('INITIALIZE_MESSENGER_REQUEST');
    stateMachine.handleSignal('STOP_SESSION_REQUEST', { sendMessage: false });
    expect(stateMachine.state).toBe('MESSENGER_INITIALIZED');
    expect(onSessionStopped).not.toHaveBeenCalled();
  });
});
