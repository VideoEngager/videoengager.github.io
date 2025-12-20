/**
 * Driver.js Tour for VideoEngager Visitor Demo (Iframe Embedding)
 * Runs only once per user (uses localStorage)
 */

// Check if tour has been shown before
const TOUR_KEY = 've-visitor-tour-shown';

function hasShownTour() {
    return localStorage.getItem(TOUR_KEY) === 'true';
}

function markTourAsShown() {
    localStorage.setItem(TOUR_KEY, 'true');
}

// Initialize tour when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Skip if tour already shown
    if (hasShownTour()) {
        return;
    }

    // Load driver.js dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.js.iife.js';
    script.onload = initTour;
    document.head.appendChild(script);
});

function initTour() {
    const driver = window.driver.js.driver({
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        progressText: '{{current}} of {{total}}',
        nextBtnText: 'Next →',
        prevBtnText: '← Previous',
        doneBtnText: 'Got it!',
        closeBtnText: 'Skip Tour',
        onDestroyed: () => {
            markTourAsShown();
        },
        popoverClass: 've-tour-popover',
        steps: [
            {
                popover: {
                    title: '🎥 Visitor Demo (Iframe)',
                    description: 'This demo shows how to embed VideoEngager via iframe using REST API.<br><br><a href="#" id="skipTourForever" style="color: #ef4444; text-decoration: underline; font-size: 13px;">Don\'t show this tour again</a>',
                    side: 'top',
                    align: 'center'
                }
            },
            {
                element: '#visitorName',
                popover: {
                    title: '👤 Your Name',
                    description: 'Enter your name (optional) to be displayed to the agent.',
                    side: 'right',
                    align: 'start'
                }
            },
            {
                element: '#startCallBtn',
                popover: {
                    title: '📞 Start Video Call',
                    description: 'Click to create interaction and launch fullscreen video interface.',
                    side: 'right',
                    align: 'start'
                }
            }
        ]
    });

    // Add custom styling
    const style = document.createElement('style');
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

    // Start the tour after a short delay
    setTimeout(() => {
        driver.drive();

        // Add skip forever handler
        setTimeout(() => {
            const skipLink = document.getElementById('skipTourForever');
            if (skipLink) {
                skipLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    markTourAsShown();
                    driver.destroy();
                });
            }
        }, 100);
    }, 800);
}
