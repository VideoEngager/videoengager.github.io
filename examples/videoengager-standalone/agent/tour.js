/**
 * Driver.js Tour for VideoEngager Agent Demo
 * Runs only once per user (uses localStorage)
 * Split into two parts: initial setup tour and dashboard tour (after agent starts)
 */

// Check if tours have been shown before
const SETUP_TOUR_KEY = 've-agent-setup-tour-shown';
const DASHBOARD_TOUR_KEY = 've-agent-dashboard-tour-shown';

function hasShownSetupTour() {
    return localStorage.getItem(SETUP_TOUR_KEY) === 'true';
}

function hasShownDashboardTour() {
    return localStorage.getItem(DASHBOARD_TOUR_KEY) === 'true';
}

function markSetupTourAsShown() {
    localStorage.setItem(SETUP_TOUR_KEY, 'true');
}

function markDashboardTourAsShown() {
    localStorage.setItem(DASHBOARD_TOUR_KEY, 'true');
}

// Initialize setup tour when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Skip if setup tour already shown
    if (hasShownSetupTour()) {
        return;
    }

    // Load driver.js dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.js.iife.js';
    script.onload = initSetupTour;
    document.head.appendChild(script);
});

function initSetupTour() {
    const driver = window.driver.js.driver({
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        progressText: '{{current}} of {{total}}',
        nextBtnText: 'Next',
        prevBtnText: 'Previous',
        doneBtnText: 'Done',
        closeBtnText: '×',
        onDestroyed: () => {
            markSetupTourAsShown();
        },
        popoverClass: 've-tour-popover',
        steps: [
            {
                popover: {
                    title: '🎧 Agent Dashboard',
                    description: 'Welcome! Let\'s set up your agent to receive video calls.<br><br><a href="#" id="skipTourForever" style="color: #ef4444; text-decoration: underline; font-size: 13px;">Don\'t show this tour again</a>',
                    side: 'top',
                    align: 'center'
                }
            },
            {
                element: '#agentEmailInput',
                popover: {
                    title: '📧 Agent Email',
                    description: 'Enter your agent email address to get started.',
                    side: 'right',
                    align: 'start'
                }
            },
            {
                element: '#startAgentBtn',
                popover: {
                    title: '🚀 Start Agent',
                    description: 'Click here to initialize and connect. You\'ll then see connection status, queue controls, and incoming calls.',
                    side: 'right',
                    align: 'start'
                }
            }
        ]
    });

    addCustomStyling();

    setTimeout(() => {
        driver.drive();

        setTimeout(() => {
            const skipLink = document.getElementById('skipTourForever');
            if (skipLink) {
                skipLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    markSetupTourAsShown();
                    markDashboardTourAsShown();
                    driver.destroy();
                });
            }
        }, 100);
    }, 800);
}

// Export function to start dashboard tour (called after agent connects)
window.startAgentDashboardTour = function () {
    // Skip if dashboard tour already shown
    if (hasShownDashboardTour()) {
        return;
    }

    // Make sure driver.js is loaded
    if (!window.driver || !window.driver.js) {
        return;
    }

    const driver = window.driver.js.driver({
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        progressText: '{{current}} of {{total}}',
        nextBtnText: 'Next',
        prevBtnText: 'Previous',
        doneBtnText: 'Done',
        closeBtnText: '×',
        onDestroyed: () => {
            markDashboardTourAsShown();
        },
        popoverClass: 've-tour-popover',
        steps: [
            {
                popover: {
                    title: '✅ Agent Connected!',
                    description: 'Great! Now let\'s learn about the agent dashboard features.',
                    side: 'top',
                    align: 'center'
                }
            },
            {
                element: '#statusDot',
                popover: {
                    title: '📡 Service Status',
                    description: 'Shows your connection to VideoEngager. <strong>Green</strong> = Connected, <strong>Yellow</strong> = Connecting, <strong>Red</strong> = Disconnected.',
                    side: 'bottom',
                    align: 'start'
                }
            },
            {
                element: '#queueStatusDot',
                popover: {
                    title: '📥 Queue Status',
                    description: 'Shows if you\'re ready to receive calls. <strong>Green</strong> = In Queue (receiving calls), <strong>Gray</strong> = Not in queue.',
                    side: 'bottom',
                    align: 'start'
                }
            },
            {
                element: '#queueToggle',
                popover: {
                    title: '🔄 Queue Toggle',
                    description: '<strong>Important:</strong> Click this switch to start receiving calls from visitors. Toggle ON (green) to join the queue and receive calls, toggle OFF (gray) to stop receiving new calls.',
                    side: 'left',
                    align: 'start'
                }
            },
            {
                element: '#callsList',
                popover: {
                    title: '📞 Incoming Calls List',
                    description: 'When visitors initiate calls, they appear here. You\'ll get a tour explaining the call buttons when your first call arrives!',
                    side: 'top',
                    align: 'center'
                }
            },
            {
                popover: {
                    title: '🎯 Ready to Receive Calls!',
                    description: 'Join the queue to start receiving calls. Open the Visitor demo in another tab to test it out!',
                    side: 'top',
                    align: 'center'
                }
            }
        ]
    });

    addCustomStyling();

    setTimeout(() => {
        driver.drive();
    }, 800);
};

// Export function to show first call tour (called when first call arrives)
const FIRST_CALL_TOUR_KEY = 've-agent-first-call-tour-shown';

function hasShownFirstCallTour() {
    return localStorage.getItem(FIRST_CALL_TOUR_KEY) === 'true';
}

function markFirstCallTourAsShown() {
    localStorage.setItem(FIRST_CALL_TOUR_KEY, 'true');
}

window.startFirstCallTour = function (callerId) {
    console.log('🎯 startFirstCallTour called with callerId:', callerId);

    // Skip if first call tour already shown
    if (hasShownFirstCallTour()) {
        console.log('⏭️ First call tour already shown, skipping');
        return;
    }

    // Make sure driver.js is loaded
    if (!window.driver || !window.driver.js) {
        console.log('❌ Driver.js not loaded yet');
        return;
    }

    console.log('✅ Starting first call tour...');

    // Wait a moment for the call element to be rendered
    setTimeout(() => {
        const callElement = document.querySelector(`[data-caller-id="${callerId}"]`);
        console.log('📍 Looking for call element with data-caller-id:', callerId);
        console.log('📍 Call element found:', callElement);

        if (!callElement) {
            console.warn('❌ Call element not found for tour. Selector:', `[data-caller-id="${callerId}"]`);
            return;
        }

        const acceptBtn = callElement.querySelector('.accept-call-btn');
        const rejectBtn = callElement.querySelector('.reject-call-btn');
        console.log('🔘 Accept button:', acceptBtn);
        console.log('🔘 Reject button:', rejectBtn);

        if (!acceptBtn || !rejectBtn) {
            console.warn('❌ Call buttons not found for tour');
            return;
        }

        console.log('🎬 All elements found, starting driver tour...');

        const driver = window.driver.js.driver({
            showProgress: true,
            showButtons: ['next', 'previous', 'close'],
            progressText: '{{current}} of {{total}}',
            nextBtnText: 'Next',
            prevBtnText: 'Previous',
            doneBtnText: 'Got it!',
            closeBtnText: '×',
            onDestroyed: () => {
                markFirstCallTourAsShown();
            },
            popoverClass: 've-tour-popover',
            steps: [
                {
                    element: callElement,
                    popover: {
                        title: '📞 Incoming Call!',
                        description: 'You\'ve received your first call! Let\'s learn how to handle it.',
                        side: 'bottom',
                        align: 'center'
                    }
                },
                {
                    element: acceptBtn,
                    popover: {
                        title: '✅ Accept Call',
                        description: 'Click this <strong>green button</strong> to answer the call and start the video session. The visitor will be connected and you\'ll see the video interface below.',
                        side: 'left',
                        align: 'start'
                    }
                },
                {
                    element: rejectBtn,
                    popover: {
                        title: '❌ Reject Call',
                        description: 'Click this <strong>red button</strong> to decline the call. The call will disappear from your queue and in already available for other agents to answer.',
                        side: 'left',
                        align: 'start'
                    }
                },
                {
                    popover: {
                        title: '🎯 Ready to Answer!',
                        description: 'You\'re all set! Accept this call to start the video session (it will appear below), or reject it if you\'re not ready yet.',
                        side: 'top',
                        align: 'center'
                    }
                }
            ]
        });

        addCustomStyling();
        console.log('🚀 Starting driver.drive()');
        driver.drive();
    }, 300);
};

function addCustomStyling() {
    // Check if style already added
    if (document.getElementById('ve-tour-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 've-tour-styles';
    style.textContent = `
        .driver-popover.ve-tour-popover {
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }
        
        .driver-popover-title {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 8px;
        }
        
        .driver-popover-description {
            font-size: 14px;
            line-height: 1.6;
            color: #475569;
        }
        
        .driver-popover-footer button {
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.2s;
            padding: 8px 16px;
            text-shadow: none !important;
        }
        
        .driver-popover-next-btn {
            background: linear-gradient(to right, #2563eb, #4f46e5) !important;
            color: white !important;
            border: none !important;
        }
        
        .driver-popover-next-btn:hover {
            transform: scale(1.05);
        }
        
        .driver-popover-prev-btn {
            background: #f1f5f9 !important;
            color: #475569 !important;
            border: none !important;
        }
        
        .driver-popover-close-btn {
            color: #64748b !important;
            width: 32px !important;
            height: 32px !important;
            border-radius: 50% !important;
            background: #f1f5f9 !important;
            font-size: 24px !important;
            line-height: 1 !important;
            padding: 0 !important;
        }
        
        .driver-popover-progress-text {
            font-size: 12px;
            color: #64748b;
        }
    `;
    document.head.appendChild(style);
}
