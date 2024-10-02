/*
  Test suite for VideoSessionStateMachine.
  Uses Jest for testing, mocking dependencies, and handling signals related to video session states.
*/

/* globals describe beforeEach jest test afterEach expect */
const VideoSessionStateMachine = require('./VideoSessionStateMachine');

describe('VideoSessionStateMachine', () => {
  let stateMachine; // Holds the instance of the VideoSessionStateMachine
  let options; // Mock options passed to the state machine for initialization
  let onSessionStarted; // Mock function for handling the 'session started' event
  let onSessionStopped; // Mock function for handling the 'session stopped' event

  // Setup before each test case
  beforeEach(() => {
    // Mock event handlers and options for state machine
    onSessionStarted = jest.fn();
    onSessionStopped = jest.fn();
    // Define mock functions and options for the state machine
    options = {
      stopGenesysVideoSession: jest.fn(), // Mock function for stopping Genesys video session
      onMessengerReady: jest.fn(), // Callback triggered when the messenger is ready
      initializeMessenger: jest.fn(), // Function to initialize the messenger
      sendStartVideoSessionMessage: jest.fn() // Function to send the start video session message
    };

    // Initialize the state machine with mocked options
    stateMachine = new VideoSessionStateMachine(options);

    // Attach mocked session started and stopped event handlers
    stateMachine.onSessionStarted(onSessionStarted);
    stateMachine.onSessionStopped(onSessionStopped);

    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  // Restore all mocked functions after each test
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test the initial state of the state machine
  test('initial state should be IDLE', () => {
    expect(stateMachine.state).toBe('IDLE'); // Verify initial state is IDLE
  });

  // Test messenger initialization process
  test('initialize messenger successfully', async () => {
    await stateMachine.handleSignal('INITIALIZE_MESSENGER_REQUEST');

    // Check if the state transitions correctly and callbacks are called
    expect(stateMachine.state).toBe('MESSENGER_INITIALIZED');
    expect(options.onMessengerReady).toHaveBeenCalled();
    expect(options.initializeMessenger).toHaveBeenCalled();
  });

  // Test starting a session without initializing the messenger
  test('start session without initializing messenger should fail', async () => {
    // Attempt to start session before messenger initialization
    await stateMachine.handleSignal('START_SESSION_REQUEST', { interactionId: '123' });

    // Verify state does not change and remains IDLE
    expect(stateMachine.state).toBe('IDLE');
  });

  // Test the full lifecycle of a video session: initialization -> start -> stop
  test('full session lifecycle', async () => {
    // Initialize messenger
    await stateMachine.handleSignal('INITIALIZE_MESSENGER_REQUEST');

    // Start video session
    await stateMachine.handleSignal('START_SESSION_REQUEST', { interactionId: '123' });
    expect(stateMachine.state).toBe('WAITING_FOR_PRECONDITION');

    // Fulfill precondition (e.g., user actions)
    await stateMachine.handleSignal('PRECONDITION_FULFILLED');
    expect(stateMachine.state).toBe('VIDEO_SESSION_ACTIVE');

    // Verify session started event triggered
    expect(onSessionStarted).toHaveBeenCalled();

    // Stop the session
    await stateMachine.handleSignal('STOP_SESSION_REQUEST');

    // Verify state and session stopped actions
    expect(stateMachine.state).toBe('MESSENGER_INITIALIZED');
    expect(options.stopGenesysVideoSession).toHaveBeenCalled();
    expect(onSessionStopped).toHaveBeenCalled();
  });

  // Test stopping a session before it starts should not trigger disconnection
  test('stop session before starting should not disconnect', async () => {
    stateMachine.handleSignal('STOP_SESSION_REQUEST', { sendMessage: false });

    // Verify state remains IDLE and no session stopped event is triggered
    expect(stateMachine.state).toBe('IDLE');
    expect(onSessionStopped).not.toHaveBeenCalled();
  });

  // Test stopping a session after messenger initialization but before session starts
  test('stop session after initializing messenger but before starting session', async () => {
    // Initialize messenger
    await stateMachine.handleSignal('INITIALIZE_MESSENGER_REQUEST');

    // Attempt to stop session
    stateMachine.handleSignal('STOP_SESSION_REQUEST', { sendMessage: false });

    // Verify state and no session stopped event triggered
    expect(stateMachine.state).toBe('MESSENGER_INITIALIZED');
    expect(onSessionStopped).not.toHaveBeenCalled();
  });
});
