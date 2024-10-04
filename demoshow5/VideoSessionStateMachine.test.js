/* globals describe beforeEach jest test expect */
const VideoSessionStateMachine = require('./videoSessionStateMachine'); // Importing the VideoSessionStateMachine module for testing.

describe('VideoSessionStateMachine', () => {
  // Variables to hold our state machine and mock callback functions.
  let stateMachine; // Holds the instance of the VideoSessionStateMachine for each test.
  let onSessionStartedCallback; // Mock function to simulate the callback when a session is started.
  let onSessionStoppedCallback; // Mock function to simulate the callback when a session is stopped.
  let startVideoCallback; // Mock function that simulates starting the video session.
  let stopVideoCallback; // Mock function that simulates stopping the video session.

  // The beforeEach block runs before each individual test case.
  beforeEach(() => {
    // Mock the callback functions using jest.fn(), which creates mock functions
    // that allow us to track how they are called and with what arguments.
    onSessionStartedCallback = jest.fn(); // Tracks when the session started callback is called.
    onSessionStoppedCallback = jest.fn(); // Tracks when the session stopped callback is called.
    startVideoCallback = jest.fn(() => Promise.resolve('Video started')); // Simulates the asynchronous start of a video session.
    stopVideoCallback = jest.fn(() => Promise.resolve('Video stopped')); // Simulates the asynchronous stop of a video session.

    // Instantiate the state machine with the mock callbacks as parameters.
    // This is done for every test to ensure we have a clean instance of the state machine.
    stateMachine = new VideoSessionStateMachine({
      onSessionStartedCallback, // Inject the mock start session callback.
      onSessionStoppedCallback, // Inject the mock stop session callback.
      startVideoCallback, // Inject the mock start video callback.
      stopVideoCallback, // Inject the mock stop video callback.
    });
  });

  // The afterEach block runs after each test case to clean up.
  afterEach(() => {
    // Clear all mock function calls to avoid data contamination between tests.
    jest.clearAllMocks();
  });

  // Test to verify that the state machine initializes in the 'IDLE' state.
  test('should initialize in IDLE state', () => {
    // The state machine should start in the 'IDLE' state.
    expect(stateMachine.state).toBe('IDLE');
  });

  // Test to check the transition from 'IDLE' to 'MESSENGER_INITIALIZED'.
  test('should transition from IDLE to MESSENGER_INITIALIZED when MESSENGER_INITIALIZED signal is received', async () => {
    // Sending the 'MESSENGER_INITIALIZED' signal to the state machine.
    await stateMachine.signal('MESSENGER_INITIALIZED');
    
    // After receiving the signal, the state should change to 'MESSENGER_INITIALIZED'.
    expect(stateMachine.state).toBe('MESSENGER_INITIALIZED');
  });

  // Test to ensure the video session starts correctly when requested.
  test('should start video session when START_SESSION_REQUEST is received in MESSENGER_INITIALIZED state', async () => {
    // Transition the state machine to 'MESSENGER_INITIALIZED' state.
    await stateMachine.signal('MESSENGER_INITIALIZED');

    // Define a sample interaction ID for the test.
    const interactionId = 'test-interaction-id';

    // Simulate a 'START_SESSION_REQUEST' signal with the interaction ID.
    await stateMachine.signal('START_SESSION_REQUEST', { interactionId });

    // Verify the state machine transitioned to 'VIDEO_SESSION_ACTIVE'.
    expect(stateMachine.state).toBe('VIDEO_SESSION_ACTIVE');

    // Ensure the startVideoCallback was called with the correct interaction ID.
    expect(startVideoCallback).toHaveBeenCalledWith(interactionId);

    // Verify that the onSessionStartedCallback was triggered after the video started.
    expect(onSessionStartedCallback).toHaveBeenCalledWith('Video started');
  });

  // Test to verify that the video session stops correctly when requested.
  test('should stop video session when STOP_SESSION_REQUEST is received in VIDEO_SESSION_ACTIVE state', async () => {
    // Transition the state machine to 'MESSENGER_INITIALIZED' state.
    await stateMachine.signal('MESSENGER_INITIALIZED');
    
    // Define a sample interaction ID for the test.
    const interactionId = 'test-interaction-id';

    // Simulate a 'START_SESSION_REQUEST' to move to 'VIDEO_SESSION_ACTIVE' state.
    await stateMachine.signal('START_SESSION_REQUEST', { interactionId });

    // Simulate a 'STOP_SESSION_REQUEST' with sendMessage: true.
    await stateMachine.signal('STOP_SESSION_REQUEST', { sendMessage: true });

    // After stopping, the state should transition back to 'MESSENGER_INITIALIZED'.
    expect(stateMachine.state).toBe('MESSENGER_INITIALIZED');

    // Ensure the stopVideoCallback was called with true (indicating message sending is requested).
    expect(stopVideoCallback).toHaveBeenCalledWith(true);

    // Verify that the onSessionStoppedCallback was triggered after the video stopped.
    expect(onSessionStoppedCallback).toHaveBeenCalledWith('Video stopped');
  });

  // Test to handle errors when starting the video and ensure the state doesn't change unexpectedly.
  test('should handle errors in startVideoCallback and remain in MESSENGER_INITIALIZED state', async () => {
    // Define an error for the mock startVideoCallback to reject.
    const error = new Error('Start video failed');
    startVideoCallback.mockImplementation(() => Promise.reject(error));

    // Simulate transitioning to 'MESSENGER_INITIALIZED' state.
    await stateMachine.signal('MESSENGER_INITIALIZED');

    // Simulate a 'START_SESSION_REQUEST' that triggers the error in startVideoCallback.
    await stateMachine.signal('START_SESSION_REQUEST', { interactionId: 'test-id' });

    // Verify that the state remains 'MESSENGER_INITIALIZED' since the start failed.
    expect(stateMachine.state).toBe('MESSENGER_INITIALIZED');
  });

  // Test to ensure stopping the video session without sending a message works.
  test('should stop session without sending message when sendMessage is false', async () => {
    // Transition the state machine to 'MESSENGER_INITIALIZED' state.
    await stateMachine.signal('MESSENGER_INITIALIZED');
    
    // Define a sample interaction ID for the test.
    const interactionId = 'test-interaction-id';

    // Simulate a 'START_SESSION_REQUEST' to move to 'VIDEO_SESSION_ACTIVE' state.
    await stateMachine.signal('START_SESSION_REQUEST', { interactionId });

    // Simulate a 'STOP_SESSION_REQUEST' with sendMessage: false.
    await stateMachine.signal('STOP_SESSION_REQUEST', { sendMessage: false });

    // Verify the state transitioned back to 'MESSENGER_INITIALIZED'.
    expect(stateMachine.state).toBe('MESSENGER_INITIALIZED');

    // Ensure the stopVideoCallback was called with false (indicating no message sending).
    expect(stopVideoCallback).toHaveBeenCalledWith(false);

    // Verify that the onSessionStoppedCallback was triggered after the video stopped.
    expect(onSessionStoppedCallback).toHaveBeenCalledWith('Video stopped');
  });

  // Test to ensure that a STOP_SESSION_REQUEST in the 'IDLE' state does not change the state.
  test('should ignore STOP_SESSION_REQUEST in IDLE state and not change state', async () => {
    // Simulate a 'STOP_SESSION_REQUEST' while in the 'IDLE' state.
    await stateMachine.signal('STOP_SESSION_REQUEST', { sendMessage: true });

    // Verify that the state remains 'IDLE' and doesn't change.
    expect(stateMachine.state).toBe('IDLE');
  });

  // Test to verify that a START_SESSION_REQUEST in the IDLE state stores the interactionId but doesn't change state.
  test('should handle START_SESSION_REQUEST in IDLE state and store interactionId', async () => {
    // Define a sample interaction ID for the test.
    const interactionId = 'test-interaction-id';

    // Simulate a 'START_SESSION_REQUEST' in the 'IDLE' state.
    await stateMachine.signal('START_SESSION_REQUEST', { interactionId });

    // Verify that the interaction ID is stored but the state remains 'IDLE'.
    expect(stateMachine.interactionId).toBe(interactionId);
    expect(stateMachine.state).toBe('IDLE');
  });

  // Test to verify that the video session won't start if interactionId is not set in MESSENGER_INITIALIZED state.
  test('should not start video session if interactionId is not set in MESSENGER_INITIALIZED state', async () => {
    // Simulate transitioning to 'MESSENGER_INITIALIZED' state.
    await stateMachine.signal('MESSENGER_INITIALIZED');

    // Verify that the interaction ID is null (i.e., not set).
    expect(stateMachine.interactionId).toBeNull();

    // Verify that the state remains 'MESSENGER_INITIALIZED' since no interaction ID is provided.
    expect(stateMachine.state).toBe('MESSENGER_INITIALIZED');
  });

  // Test to handle errors when stopping the video session and ensure the state doesn't change unexpectedly.
  test('should handle STOP_SESSION_REQUEST when stopVideoCallback fails and remain in MESSENGER_INITIALIZED state', async () => {
    // Define an error for the mock stopVideoCallback to reject.
    const error = new Error('Stop video failed');
    stopVideoCallback.mockImplementation(() => Promise.reject(error));

    // Simulate transitioning to 'MESSENGER_INITIALIZED' state.
    await stateMachine.signal('MESSENGER_INITIALIZED');
    
    // Define a sample interaction ID for the test.
    const interactionId = 'test-interaction-id';

    // Simulate a 'START_SESSION_REQUEST' to move to 'VIDEO_SESSION_ACTIVE' state.
    await stateMachine.signal('START_SESSION_REQUEST', { interactionId });

    // Simulate a 'STOP_SESSION_REQUEST' that triggers the error in stopVideoCallback.
    await stateMachine.signal('STOP_SESSION_REQUEST', { sendMessage: true });

    // Verify that the state remains 'MESSENGER_INITIALIZED' since the stop failed.
    expect(stateMachine.state).toBe('MESSENGER_INITIALIZED');
  });
});
