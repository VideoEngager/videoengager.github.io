import { useRef, useEffect, useState } from 'react';
import { init, call, endCall, on, off, isInitialized } from 'videoengager-agent-sdk';

interface CallState {
  status: 'NONE' | 'PRE_CALL' | 'CALL_STARTED' | 'END_CALL' | 'FINISHED';
  email: string;
  callerEmail: string;
  visitorId: string;
  pin: string;
  shortUrl: string;
  tennant_id: string;
  attributes?: Record<string, unknown>;
  inActiveSession: boolean;
}

const VideoEngager = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [agentEmail, setAgentEmail] = useState('');
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [currentCall, setCurrentCall] = useState<CallState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const initializingRef = useRef(false);

  // Parse URL parameters manually to preserve '+' signs in email addresses
  // URLSearchParams converts '+' to space by default, which breaks email addresses
  const getUrlParam = (param: string): string | null => {
    const search = window.location.search.substring(1);
    const params = search.split('&');
    for (const p of params) {
      const [key, value] = p.split('=');
      if (decodeURIComponent(key) === param) {
        return decodeURIComponent(value);
      }
    }
    return null;
  };

  const apiKey = getUrlParam('apiKey');
  const domain = getUrlParam('domain');
  const urlAgentEmail = getUrlParam('agentEmail');
  const organizationId = getUrlParam('organizationId') || 'EXTID-1';

  useEffect(() => {
    // Event listeners
    const handleSessionStarted = (callState: CallState) => {
      console.log('Session started:', callState);
      setCurrentCall(callState);
    };

    const handleSessionEnded = (callState: CallState) => {
      console.log('Session ended:', callState);
      setCurrentCall(null);
    };

    const handleSessionFailed = (payload: unknown) => {
      console.error('Session failed:', payload);
      setError('Session failed to start');
    };

    const handleCallStateUpdated = (callState: CallState) => {
      console.log('Call state updated:', callState.status);
      setCurrentCall(callState);
    };

    on('sessionStarted', handleSessionStarted);
    on('sessionEnded', handleSessionEnded);
    on('sessionFailed', handleSessionFailed);
    on('callStateUpdated', handleCallStateUpdated);

    return () => {
      off('sessionStarted', handleSessionStarted);
      off('sessionEnded', handleSessionEnded);
      off('sessionFailed', handleSessionFailed);
      off('callStateUpdated', handleCallStateUpdated);
    };
  }, []);

  const handleInitialize = async () => {
    // Validate required URL parameters
    if (!apiKey) {
      setError('API Key is required. Please provide ?apiKey=... in the URL');
      return;
    }
    if (!domain) {
      setError('Domain is required. Please provide ?domain=... in the URL');
      return;
    }

    const emailToUse = urlAgentEmail || agentEmail.trim();
    if (!emailToUse) {
      setError('Agent email is required. Please provide ?agentEmail=... in the URL or enter it below');
      return;
    }

    try {
      // Prevent multiple simultaneous initialization attempts
      if (initializingRef.current) {
        console.log('VideoEngager SDK initialization already in progress');
        return;
      }

      if (isInitialized()) {
        console.log('VideoEngager SDK already initialized');
        setIsSDKReady(true);
        return;
      }

      initializingRef.current = true;
      setError(null);

      await init({
        authMethod: 'generic',
        apiKey: apiKey,
        domain: domain,
        agentEmail: emailToUse,
        organizationId: organizationId,
        options: {
          uiHandlers: {
            openIframe: async (url: string) => {
              console.log('Opening iframe with URL:', url);
              setIframeUrl(url);
            },
            closeIframe: async () => {
              console.log('Closing iframe');
              setIframeUrl(null);
              iframeRef.current = null;
            },
            getIframe: () => {
              return iframeRef.current;
            }
          }
        }
      });

      setIsSDKReady(true);
      console.log('VideoEngager SDK initialized successfully');
    } catch (err) {
      // Handle the AGENT_ALREADY_INITIALIZED error gracefully
      const error = err as { code?: string; message?: string };
      if (error?.code === 'AGENT_ALREADY_INITIALIZED') {
        console.log('VideoEngager SDK already initialized (caught in error)');
        setIsSDKReady(true);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize VideoEngager SDK';
        console.error('Error initializing VideoEngager:', err);
        setError(errorMessage);
      }
    } finally {
      initializingRef.current = false;
    }
  };

  const startCall = async (customerId?: string) => {
    try {
      setError(null);
      await call(customerId ? { customerId } : undefined);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start call';
      console.error('Error starting call:', err);
      setError(errorMessage);
    }
  };

  const stopCall = async () => {
    try {
      setError(null);
      await endCall();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end call';
      console.error('Error ending call:', err);
      setError(errorMessage);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>VideoEngager Agent</h1>

      {!isSDKReady ? (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
            <p style={{ margin: '5px 0', fontSize: '14px' }}>
              <strong>API Key:</strong> {apiKey || <span style={{ color: '#c62828' }}>Missing (required)</span>}
            </p>
            <p style={{ margin: '5px 0', fontSize: '14px' }}>
              <strong>Domain:</strong> {domain || <span style={{ color: '#c62828' }}>Missing (required)</span>}
            </p>
            <p style={{ margin: '5px 0', fontSize: '14px' }}>
              <strong>Organization ID:</strong> {organizationId}
            </p>
          </div>

          {!urlAgentEmail && (
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="agent-email" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Agent Email:
              </label>
              <input
                id="agent-email"
                type="email"
                value={agentEmail}
                onChange={(e) => setAgentEmail(e.target.value)}
                placeholder="Enter your agent email"
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  padding: '10px',
                  fontSize: '16px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleInitialize();
                  }
                }}
              />
            </div>
          )}

          {urlAgentEmail && (
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Agent Email:</strong> {urlAgentEmail}
              </p>
            </div>
          )}

          <button
            onClick={handleInitialize}
            disabled={!apiKey || !domain || (!urlAgentEmail && !agentEmail.trim())}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: (apiKey && domain && (urlAgentEmail || agentEmail.trim())) ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (apiKey && domain && (urlAgentEmail || agentEmail.trim())) ? 'pointer' : 'not-allowed'
            }}
          >
            Initialize SDK
          </button>

          {error && (
            <div style={{
              padding: '10px',
              backgroundColor: '#ffebee',
              color: '#c62828',
              borderRadius: '4px',
              marginTop: '10px',
              maxWidth: '400px'
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '20px' }}>
            <p>
              <strong>Status:</strong>{' '}
              <span style={{ color: 'green' }}>Ready</span>
            </p>
            <p>
              <strong>Agent Email:</strong> {urlAgentEmail || agentEmail}
            </p>
            <p>
              <strong>Domain:</strong> {domain}
            </p>
            <p>
              <strong>Organization ID:</strong> {organizationId}
            </p>

            {currentCall && (
              <div style={{ marginTop: '10px' }}>
                <p><strong>Call Status:</strong> {currentCall.status}</p>
                <p><strong>Visitor ID:</strong> {currentCall.visitorId}</p>
                <p><strong>Active Session:</strong> {currentCall.inActiveSession ? 'Yes' : 'No'}</p>
                {currentCall.shortUrl && (
                  <p><strong>Short URL:</strong> <a href={currentCall.shortUrl} target="_blank" rel="noopener noreferrer">{currentCall.shortUrl}</a></p>
                )}
              </div>
            )}

            {error && (
              <div style={{
                padding: '10px',
                backgroundColor: '#ffebee',
                color: '#c62828',
                borderRadius: '4px',
                marginTop: '10px'
              }}>
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => startCall()}
              disabled={currentCall?.inActiveSession}
              style={{
                padding: '10px 20px',
                marginRight: '10px',
                fontSize: '16px',
                backgroundColor: !currentCall?.inActiveSession ? '#4CAF50' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !currentCall?.inActiveSession ? 'pointer' : 'not-allowed'
              }}
            >
              Start Call
            </button>

            <button
              onClick={() => startCall('customer-123')}
              disabled={currentCall?.inActiveSession}
              style={{
                padding: '10px 20px',
                marginRight: '10px',
                fontSize: '16px',
                backgroundColor: !currentCall?.inActiveSession ? '#2196F3' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !currentCall?.inActiveSession ? 'pointer' : 'not-allowed'
              }}
            >
              Start Call with Customer ID
            </button>

            <button
              onClick={stopCall}
              disabled={!currentCall?.inActiveSession}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: currentCall?.inActiveSession ? '#f44336' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentCall?.inActiveSession ? 'pointer' : 'not-allowed'
              }}
            >
              End Call
            </button>
          </div>
        </>
      )}

      <div
        ref={containerRef}
        id="video-container"
        style={{
          minHeight: '400px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {iframeUrl ? (
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            style={{
              width: '100%',
              height: '600px',
              border: '1px solid #ccc',
              borderRadius: '8px'
            }}
            allow="camera; microphone; display-capture"
            title="VideoEngager Widget"
          />
        ) : (
          <p style={{ color: '#999' }}>
            {isSDKReady ? 'Video widget will appear here when call starts' : 'Please initialize SDK first'}
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoEngager;
