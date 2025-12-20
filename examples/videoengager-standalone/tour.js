/**
 * Driver.js Tour for VideoEngager Standalone Configuration
 * Runs only once per user (uses localStorage)
 * Split into two parts: form tour and demo selection tour
 */

// Check if tours have been shown before
const FORM_TOUR_KEY = 've-config-form-tour-shown';
const DEMO_TOUR_KEY = 've-config-demo-tour-shown';

function hasShownFormTour() {
    return localStorage.getItem(FORM_TOUR_KEY) === 'true';
}

function hasShownDemoTour() {
    return localStorage.getItem(DEMO_TOUR_KEY) === 'true';
}

function markFormTourAsShown() {
    localStorage.setItem(FORM_TOUR_KEY, 'true');
}

function markDemoTourAsShown() {
    localStorage.setItem(DEMO_TOUR_KEY, 'true');
}

// Initialize form tour when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Skip if form tour already shown
    if (hasShownFormTour()) {
        return;
    }

    // Load driver.js dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.js.iife.js';
    script.onload = initFormTour;
    document.head.appendChild(script);
});

function initFormTour() {
    const driver = window.driver.js.driver({
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        progressText: '{{current}} of {{total}}',
        nextBtnText: 'Next',
        prevBtnText: 'Previous',
        doneBtnText: 'Done',
        closeBtnText: '×',
        onDestroyed: () => {
            markFormTourAsShown();
        },
        popoverClass: 've-tour-popover',
        steps: [
            {
                popover: {
                    title: '👋 VideoEngager Standalone Demo',
                    description: 'This demo showcases VideoEngager\'s video calling in <strong>standalone mode</strong> - enabling video calls between agents and visitors without requiring third-party contact center platforms.<br><br><a href="#" id="skipTourForever" style="color: #ef4444; text-decoration: underline; font-size: 13px;">Don\'t show this tour again</a>',
                    side: 'top',
                    align: 'center'
                }
            },
            {
                element: '#configForm',
                popover: {
                    title: '⚙️ VideoEngager Configuration',
                    description: 'These settings are retrieved from your <strong>VideoEngager Settings Page</strong>.<br><br>📞 <strong>Need access?</strong><br>• Contact VideoEngager support for your API key<br>• Not registered yet? <a href="https://videoengager.com/" target="_blank" style="color: #2563eb; text-decoration: underline;">Request a demo</a>',
                    side: 'right',
                    align: 'start'
                }
            },
            {
                element: 'button[type="submit"]',
                popover: {
                    title: '✅ Continue',
                    description: 'Once you\'ve entered your VideoEngager credentials, click here to see demo options.',
                    side: 'top',
                    align: 'center'
                }
            }
        ]
    });

    addCustomStyling();

    // Start the form tour
    setTimeout(() => {
        driver.drive();

        // Add skip forever handler
        setTimeout(() => {
            const skipLink = document.getElementById('skipTourForever');
            if (skipLink) {
                skipLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    markFormTourAsShown();
                    markDemoTourAsShown();
                    driver.destroy();
                });
            }
        }, 100);
    }, 500);
}

// Export function to start demo selection tour (called after form submission)
window.startDemoSelectionTour = function () {
    // Skip if demo tour already shown
    if (hasShownDemoTour()) {
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
            markDemoTourAsShown();
        },
        popoverClass: 've-tour-popover',
        steps: [
            {
                popover: {
                    title: '🎯 Choose Your Demo',
                    description: 'Select which demo to launch in a new tab.',
                    side: 'top',
                    align: 'center'
                }
            },
            {
                element: '#launchAgentBtn',
                popover: {
                    title: '🎧 Launch Agent Demo',
                    description: 'Opens the Agent dashboard where you can receive and manage video calls.',
                    side: 'top',
                    align: 'start'
                }
            },
            {
                element: '#launchVisitorBtn',
                popover: {
                    title: '🎥 Launch Visitor Demo',
                    description: 'Opens the Visitor interface to initiate video calls to agents.',
                    side: 'top',
                    align: 'end'
                }
            }
        ]
    });

    addCustomStyling();

    setTimeout(() => {
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
