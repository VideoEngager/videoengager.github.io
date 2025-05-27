document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const tenantForm = document.getElementById('tenant-form');
    const schedulingForm = document.getElementById('scheduling-form');
    const schedulingSection = document.getElementById('scheduling-section');
    const readonlyNotice = document.getElementById('readonly-notice');
    
    // Tenant form inputs
    const tenantIdInput = document.getElementById('tenant-id');
    const endpointUrlInput = document.getElementById('endpoint-url');
    
    // Scheduling form inputs
    const firstnameInput = document.getElementById('firstname');
    const lastnameInput = document.getElementById('lastname');
    const emailInput = document.getElementById('email');
    const phonenumberInput = document.getElementById('phonenumber');
    const desiredTimeInput = document.getElementById('desired_time');
    
    // Initialize time slot picker
    const timeSlotPicker = new TimeSlotPicker('desired_time_display', 'desired_time', 'time-picker-popup');
    
    // State management
    let isTenantConfigured = false;
    
    // Initialize Schedule Manager
    const scheduleManager = new ScheduleManager();

    // Validation functions
    function validateTenantId(value) {
        return value.trim().length >= 3 && /^[a-zA-Z0-9\-_]+$/.test(value.trim());
    }

    function validateEndpointUrl(value) {
        try {
            const url = new URL(value.trim());
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    }

    function validateEmail(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value.trim());
    }

    function validatePhone(value) {
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(value.trim());
    }

    function validateName(value) {
        return value.trim().length >= 2;
    }

    // Error display function
    function showError(input, errorId, show) {
        const errorElement = document.getElementById(errorId);
        if (show) {
            errorElement.style.display = 'block';
            input.style.borderColor = '#e53e3e';
        } else {
            errorElement.style.display = 'none';
            input.style.borderColor = '';
        }
    }

    // Google Calendar event creation function
    const createGoogleCalendarEvent = function (fullText) {
        Date.prototype.addHours = function (h) {
            this.setTime(this.getTime() + (h * 60 * 60 * 1000));
            return this;
        };

        const isoToIcal = function (str) {
            str = str.replace(/-/g, '');
            str = str.replace(/:/g, '');
            str = str.replace('.', '');
            str = str.replace('00000Z', '00Z');
            return str;
        };

        const getContentOfLineDefinition = function (definition) {
            return fullText.substring(fullText.indexOf(definition)).substring(definition.length, fullText.substring(fullText.indexOf(definition)).indexOf('\r'));
        };

        const toIsoWithOffset = function (date) {
            return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
        };

        const icalStr = getContentOfLineDefinition('DTSTART:');
        const strYear = icalStr.substr(0, 4);
        const strMonth = parseInt(icalStr.substr(4, 2), 10) - 1;
        const strDay = icalStr.substr(6, 2);
        const strHour = icalStr.substr(9, 2);
        const strMin = icalStr.substr(11, 2);
        const strSec = icalStr.substr(13, 2);

        const oDate = new Date(strYear, strMonth, strDay, strHour, strMin, strSec);
        const dates = isoToIcal(toIsoWithOffset(oDate)) + '/' + isoToIcal(toIsoWithOffset(oDate.addHours(1)));

        const googleEvent = {
            baseUrl: 'https://calendar.google.com/calendar/r/eventedit?',
            text: getContentOfLineDefinition('SUMMARY:'),
            dates: dates,
            details: getContentOfLineDefinition('DESCRIPTION:') + '\n' + getContentOfLineDefinition('URL:'),
            location: getContentOfLineDefinition('LOCATION:')
        };

        return `${googleEvent.baseUrl}text=${googleEvent.text}&dates=${googleEvent.dates}&details=${googleEvent.details}&location=${googleEvent.location}`;
    };

    // Show booking success message
    function showBookingSuccess(bookingResult) {
        const responseData = bookingResult.data;
        const selectedSlot = timeSlotPicker.getSelectedSlot();
        
        // Extract data from response
        const meetingUrl = responseData.videoengager?.meetingUrl || '';
        const icsCalendarData = responseData.icsCalendarData || '';
        const customerName = responseData.videoengager?.name || '';
        const meetingCode = responseData.videoengager?.code || '';
        
        // Create action buttons URLs
        const googleCalendarUrl = icsCalendarData ? createGoogleCalendarEvent(icsCalendarData) : '';
        const icsDownloadUrl = icsCalendarData ? `data:text/plain;charset=utf-8,${encodeURIComponent(icsCalendarData)}` : '';
        
        const successDiv = document.createElement('div');
        successDiv.className = 'booking-success';
        successDiv.innerHTML = `
            <div class="success-header">
                <span class="success-icon">✅</span>
                <strong>Appointment Booked Successfully!</strong>
                <button class="success-close-btn" type="button" aria-label="Close success message">&times;</button>
            </div>
            <div class="success-details">
                <div class="appointment-info">
                    <p><strong>Your video meeting is scheduled for:</strong></p>
                    <p class="appointment-time">${selectedSlot?.date} at ${selectedSlot?.displayTime}</p>
                    ${customerName ? `<p><strong>Attendee:</strong> ${customerName}</p>` : ''}
                    ${meetingCode ? `<p><strong>Meeting Code:</strong> ${meetingCode}</p>` : ''}
                </div>
                
                <div class="action-buttons">
                    ${meetingUrl ? `
                        <a href="${meetingUrl}" target="_blank" class="action-btn primary-btn">
                            <span class="btn-icon">🎥</span>
                            Join Video Meeting
                        </a>
                    ` : ''}
                    
                    ${googleCalendarUrl ? `
                        <a href="${googleCalendarUrl}" target="_blank" class="action-btn secondary-btn">
                            <span class="btn-icon">📅</span>
                            Add to Google Calendar
                        </a>
                    ` : ''}
                    
                    ${icsDownloadUrl ? `
                        <a href="${icsDownloadUrl}" download="meeting-${meetingCode || 'appointment'}.ics" class="action-btn secondary-btn">
                            <span class="btn-icon">📥</span>
                            Download ICS File
                        </a>
                    ` : ''}
                </div>
                
                <p class="success-note">
                    <strong>Important:</strong> Please save this information. You will also receive a confirmation email shortly.
                </p>
            </div>
        `;
        
        successDiv.style.cssText = `
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            border: 2px solid #28a745;
            border-radius: 12px;
            padding: 25px;
            margin-top: 20px;
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.15);
            animation: slideIn 0.5s ease-out;
        `;
        
        // Add close button event listener
        const closeBtn = successDiv.querySelector('.success-close-btn');
        closeBtn.addEventListener('click', function() {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        });
        
        // Add comprehensive styles for success message
        const style = document.createElement('style');
        if (!document.querySelector('#success-styles')) {
            style.id = 'success-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .success-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    margin-bottom: 20px;
                    color: #155724;
                    font-size: 1.2rem;
                    border-bottom: 1px solid #28a745;
                    padding-bottom: 15px;
                }
                .success-header .success-icon {
                    font-size: 1.5rem;
                }
                .success-close-btn {
                    background: none;
                    border: none;
                    color: #155724;
                    font-size: 1.8rem;
                    cursor: pointer;
                    padding: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                    margin-left: auto;
                }
                .success-close-btn:hover {
                    background: rgba(21, 87, 36, 0.1);
                    transform: scale(1.1);
                }
                .success-details {
                    color: #155724;
                    line-height: 1.6;
                }
                .appointment-info {
                    margin-bottom: 25px;
                }
                .appointment-info p {
                    margin-bottom: 8px;
                }
                .appointment-time {
                    font-size: 1.1rem;
                    font-weight: bold;
                    color: #0d4f1c;
                    background: rgba(40, 167, 69, 0.1);
                    padding: 8px 12px;
                    border-radius: 6px;
                    display: inline-block;
                    margin: 8px 0;
                }
                .action-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin: 20px 0;
                    padding: 20px;
                    background: rgba(255, 255, 255, 0.7);
                    border-radius: 8px;
                    border: 1px solid rgba(40, 167, 69, 0.2);
                }
                .action-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 20px;
                    border-radius: 6px;
                    text-decoration: none;
                    font-weight: bold;
                    font-size: 0.95rem;
                    transition: all 0.2s ease;
                    border: 2px solid;
                    min-width: 160px;
                    justify-content: center;
                }
                .primary-btn {
                    background: #007cba;
                    color: white;
                    border-color: #007cba;
                }
                .primary-btn:hover {
                    background: #005a87;
                    border-color: #005a87;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0, 124, 186, 0.3);
                }
                .secondary-btn {
                    background: white;
                    color: #28a745;
                    border-color: #28a745;
                }
                .secondary-btn:hover {
                    background: #28a745;
                    color: white;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
                }
                .btn-icon {
                    font-size: 1.1rem;
                }
                .success-note {
                    font-style: italic;
                    opacity: 0.9;
                    background: rgba(40, 167, 69, 0.1);
                    padding: 12px;
                    border-radius: 6px;
                    border-left: 4px solid #28a745;
                    margin-top: 15px;
                }
                
                @media (max-width: 600px) {
                    .action-buttons {
                        flex-direction: column;
                    }
                    .action-btn {
                        min-width: auto;
                        width: 100%;
                    }
                    .success-header {
                        font-size: 1.1rem;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove any existing success/error messages
        const existingMessages = schedulingSection.querySelectorAll('.booking-success, .booking-error');
        existingMessages.forEach(msg => msg.remove());
        
        schedulingSection.appendChild(successDiv);
        
        // No auto-removal - user must manually close
    }

    // Show booking error message
    function showBookingError(errorMessage) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'booking-error';
        errorDiv.innerHTML = `
            <div class="error-header">
                <span class="error-icon">❌</span>
                <strong>Booking Failed</strong>
                <button class="error-close-btn" type="button" aria-label="Close error message">&times;</button>
            </div>
            <div class="error-details">
                <p>We couldn't complete your appointment booking:</p>
                <p class="error-message">${errorMessage}</p>
                <p class="error-note">Please try again or contact support if the problem persists.</p>
            </div>
        `;
        errorDiv.style.cssText = `
            background: #f8d7da;
            border: 2px solid #dc3545;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
            animation: slideIn 0.5s ease-out;
        `;
        
        // Add close button event listener
        const closeBtn = errorDiv.querySelector('.error-close-btn');
        closeBtn.addEventListener('click', function() {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        });
        
        // Add error styles
        const style = document.createElement('style');
        if (!document.querySelector('#error-styles')) {
            style.id = 'error-styles';
            style.textContent = `
                .error-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    margin-bottom: 15px;
                    color: #721c24;
                    font-size: 1.1rem;
                }
                .error-icon {
                    font-size: 1.3rem;
                }
                .error-close-btn {
                    background: none;
                    border: none;
                    color: #721c24;
                    font-size: 1.8rem;
                    cursor: pointer;
                    padding: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                    margin-left: auto;
                }
                .error-close-btn:hover {
                    background: rgba(114, 28, 36, 0.1);
                    transform: scale(1.1);
                }
                .error-details {
                    color: #721c24;
                    line-height: 1.6;
                }
                .error-details p {
                    margin-bottom: 8px;
                }
                .error-message {
                    background: rgba(220, 53, 69, 0.1);
                    padding: 8px 12px;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 0.9rem;
                }
                .error-note {
                    font-style: italic;
                    opacity: 0.9;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove any existing success/error messages
        const existingMessages = schedulingSection.querySelectorAll('.booking-success, .booking-error');
        existingMessages.forEach(msg => msg.remove());
        
        schedulingSection.appendChild(errorDiv);
        
        // No auto-removal - user must manually close
    }

    // Show availability results
    function showAvailabilityResults(data) {
        // Create results container
        const resultsDiv = document.createElement('div');
        resultsDiv.className = 'availability-results';
        resultsDiv.innerHTML = `
            <h3>Available Time Slots</h3>
            <p>Availability data retrieved successfully!</p>
            <pre>${JSON.stringify(data, null, 2)}</pre>
        `;
        resultsDiv.style.cssText = `
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 4px;
            padding: 15px;
            margin-top: 20px;
            color: #155724;
            font-size: 0.9rem;
            max-height: 300px;
            overflow-y: auto;
        `;
        
        // Remove any existing results
        const existingResults = schedulingSection.querySelector('.availability-results');
        if (existingResults) {
            existingResults.remove();
        }
        
        schedulingSection.appendChild(resultsDiv);
    }

    // Show connection warning
    function showConnectionWarning(message) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'connection-warning';
        warningDiv.innerHTML = `<strong>Connection Warning:</strong> ${message}`;
        warningDiv.style.cssText = `
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            padding: 12px;
            margin-bottom: 20px;
            color: #856404;
            font-size: 0.9rem;
        `;
        
        schedulingSection.insertBefore(warningDiv, schedulingForm);
        
        // Remove warning after 10 seconds
        setTimeout(() => {
            if (warningDiv.parentNode) {
                warningDiv.parentNode.removeChild(warningDiv);
            }
        }, 10000);
    }

    // Enable scheduling form
    function enableSchedulingForm() {
        // Remove readonly attributes
        firstnameInput.removeAttribute('readonly');
        lastnameInput.removeAttribute('readonly');
        emailInput.removeAttribute('readonly');
        phonenumberInput.removeAttribute('readonly');
        
        // Add enabled class for styling
        firstnameInput.classList.add('enabled');
        lastnameInput.classList.add('enabled');
        emailInput.classList.add('enabled');
        phonenumberInput.classList.add('enabled');
        
        // Enable time picker
        timeSlotPicker.enable();
        
        // Enable buttons
        const submitBtn = schedulingForm.querySelector('button[type="submit"]');
        const resetBtn = schedulingForm.querySelector('button[type="reset"]');
        submitBtn.disabled = false;
        resetBtn.disabled = false;
        
        // Update section styling
        schedulingSection.classList.remove('readonly');
        schedulingSection.classList.add('enabled');
        
        // Update notice
        readonlyNotice.innerHTML = '<strong>Form Enabled:</strong> Loading available time slots...';
        readonlyNotice.classList.add('success');
        
        // Load time slots
        loadAvailableTimeSlots();
        
        // Add success animation
        schedulingSection.classList.add('success-animation');
        setTimeout(() => {
            schedulingSection.classList.remove('success-animation');
        }, 600);
        
        // Focus first input
        firstnameInput.focus();
        
        isTenantConfigured = true;
    }

    // Refresh availability after booking
    async function refreshAvailability() {
        try {
            console.log('Refreshing availability after successful booking...');
            
            const availabilityResult = await scheduleManager.getAvailability();
            
            if (availabilityResult.success) {
                // Update the time slot picker with fresh data
                timeSlotPicker.renderTimeSlots(availabilityResult.data);
                console.log('Availability refreshed successfully');
            } else {
                console.warn('Failed to refresh availability:', availabilityResult.error);
                // Don't show error to user as this is a background refresh
            }
            
        } catch (error) {
            console.error('Error refreshing availability:', error);
            // Don't show error to user as this is a background refresh
        }
    }

    // Load available time slots
    async function loadAvailableTimeSlots() {
        try {
            timeSlotPicker.showLoading();
            
            const availabilityResult = await scheduleManager.getAvailability();
            
            if (availabilityResult.success) {
                timeSlotPicker.renderTimeSlots(availabilityResult.data);
                
                // Hide notice after successful load
                setTimeout(() => {
                    readonlyNotice.classList.add('hidden');
                }, 2000);
                
            } else {
                timeSlotPicker.showError(availabilityResult.error);
                console.error('Failed to load time slots:', availabilityResult.error);
            }
            
        } catch (error) {
            timeSlotPicker.showError('Failed to load available time slots');
            console.error('Error loading time slots:', error);
        }
    }

    // Tenant form validation
    tenantIdInput.addEventListener('blur', function() {
        const isValid = validateTenantId(this.value);
        showError(this, 'tenant-id-error', !isValid && this.value.trim() !== '');
    });

    endpointUrlInput.addEventListener('blur', function() {
        const isValid = validateEndpointUrl(this.value);
        showError(this, 'endpoint-url-error', !isValid && this.value.trim() !== '');
    });

    // Scheduling form validation (when enabled)
    function setupSchedulingValidation() {
        firstnameInput.addEventListener('blur', function() {
            if (!isTenantConfigured) return;
            const isValid = validateName(this.value);
            showError(this, 'firstname-error', !isValid && this.value.trim() !== '');
        });

        lastnameInput.addEventListener('blur', function() {
            if (!isTenantConfigured) return;
            const isValid = validateName(this.value);
            showError(this, 'lastname-error', !isValid && this.value.trim() !== '');
        });

        emailInput.addEventListener('blur', function() {
            if (!isTenantConfigured) return;
            const isValid = validateEmail(this.value);
            showError(this, 'email-error', !isValid && this.value.trim() !== '');
        });

        phonenumberInput.addEventListener('blur', function() {
            if (!isTenantConfigured) return;
            const isValid = validatePhone(this.value);
            showError(this, 'phonenumber-error', !isValid && this.value.trim() !== '');
        });

        desiredTimeInput.addEventListener('change', function() {
            if (!isTenantConfigured) return;
            const isValid = timeSlotPicker.isValid();
            showError(this, 'desired_time-error', !isValid);
        });
    }

    // Setup scheduling validation listeners
    setupSchedulingValidation();

    // Tenant form submission
    tenantForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const tenantId = tenantIdInput.value.trim();
        const endpointUrl = endpointUrlInput.value.trim();
        
        let isFormValid = true;

        // Validate tenant ID
        if (!tenantId || !validateTenantId(tenantId)) {
            showError(tenantIdInput, 'tenant-id-error', true);
            isFormValid = false;
        } else {
            showError(tenantIdInput, 'tenant-id-error', false);
        }

        // Validate endpoint URL
        if (!endpointUrl || !validateEndpointUrl(endpointUrl)) {
            showError(endpointUrlInput, 'endpoint-url-error', true);
            isFormValid = false;
        } else {
            showError(endpointUrlInput, 'endpoint-url-error', false);
        }

        if (isFormValid) {
            const submitBtn = tenantForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Show success state
            submitBtn.innerHTML = '<span>✓</span> Configuration Saved!';
            submitBtn.style.background = '#28a745';
            submitBtn.disabled = true;
            
            // Configure the schedule manager
            scheduleManager.configure(endpointUrl, tenantId);
            
            // Test the connection and enable scheduling form
            setTimeout(async () => {
                // Test connection first
                const connectionTest = await scheduleManager.testConnection();
                
                if (connectionTest.success) {
                    console.log('Connection test passed:', connectionTest);
                    enableSchedulingForm();
                } else {
                    console.warn('Connection test failed:', connectionTest);
                    // Still enable the form but show a warning
                    enableSchedulingForm();
                    showConnectionWarning(connectionTest.message);
                }
                
                // Reset button after another delay
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.background = '';
                    submitBtn.disabled = false;
                }, 2000);
            }, 1000);

            console.log('Tenant form submitted:', { tenantId, endpointUrl });
        }
    });

    // Scheduling form submission
    schedulingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!isTenantConfigured) {
            alert('Please configure tenant settings first.');
            return;
        }
        
        const firstname = firstnameInput.value.trim();
        const lastname = lastnameInput.value.trim();
        const email = emailInput.value.trim();
        const phonenumber = phonenumberInput.value.trim();
        const desiredTime = desiredTimeInput.value.trim();
        
        let isFormValid = true;

        // Validate all fields
        if (!firstname || !validateName(firstname)) {
            showError(firstnameInput, 'firstname-error', true);
            isFormValid = false;
        } else {
            showError(firstnameInput, 'firstname-error', false);
        }

        if (!lastname || !validateName(lastname)) {
            showError(lastnameInput, 'lastname-error', true);
            isFormValid = false;
        } else {
            showError(lastnameInput, 'lastname-error', false);
        }

        if (!email || !validateEmail(email)) {
            showError(emailInput, 'email-error', true);
            isFormValid = false;
        } else {
            showError(emailInput, 'email-error', false);
        }

        if (!phonenumber || !validatePhone(phonenumber)) {
            showError(phonenumberInput, 'phonenumber-error', true);
            isFormValid = false;
        } else {
            showError(phonenumberInput, 'phonenumber-error', false);
        }

        if (!desiredTime || !timeSlotPicker.isValid()) {
            showError(desiredTimeInput, 'desired_time-error', true);
            isFormValid = false;
        } else {
            showError(desiredTimeInput, 'desired_time-error', false);
        }

        if (isFormValid) {
            const submitBtn = schedulingForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Show loading state
            submitBtn.innerHTML = '<span>⏳</span> Booking Appointment...';
            submitBtn.style.background = '#007cba';
            submitBtn.disabled = true;
            
            try {
                // Prepare booking data
                const bookingData = {
                    firstname: firstname,
                    lastname: lastname,
                    phonenumber: phonenumber,
                    email: email,
                    desiredTime: desiredTime
                };
                
                // Book the callback using the schedule manager
                const bookingResult = await scheduleManager.bookCallback(bookingData);
                
                if (bookingResult.success) {
                    // Show success state
                    submitBtn.innerHTML = '<span>✓</span> Appointment Booked!';
                    submitBtn.style.background = '#28a745';
                    
                    console.log('Callback booking successful:', {
                        bookingData: bookingData,
                        response: bookingResult.data,
                        selectedTimeSlot: timeSlotPicker.getSelectedSlot()
                    });
                    
                    // Show success message to user
                    showBookingSuccess(bookingResult);
                    
                    // Refetch availability to update time slots
                    await refreshAvailability();
                    
                } else {
                    // Show error state
                    submitBtn.innerHTML = '<span>⚠</span> Booking Failed';
                    submitBtn.style.background = '#dc3545';
                    
                    console.error('Callback booking failed:', bookingResult.error);
                    showBookingError(bookingResult.error);
                }
                
            } catch (error) {
                // Show error state
                submitBtn.innerHTML = '<span>⚠</span> Error Occurred';
                submitBtn.style.background = '#dc3545';
                
                console.error('Unexpected error during booking:', error);
                showBookingError(`An unexpected error occurred: ${error.message}`);
            }
            
            // Reset button after delay
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
            }, 4000);
        }
    });

    // Reset form handlers
    tenantForm.addEventListener('reset', function() {
        showError(tenantIdInput, 'tenant-id-error', false);
        showError(endpointUrlInput, 'endpoint-url-error', false);
    });

    schedulingForm.addEventListener('reset', function() {
        if (!isTenantConfigured) return;
        
        showError(firstnameInput, 'firstname-error', false);
        showError(lastnameInput, 'lastname-error', false);
        showError(emailInput, 'email-error', false);
        showError(phonenumberInput, 'phonenumber-error', false);
        showError(desiredTimeInput, 'desired_time-error', false);
        timeSlotPicker.reset();
    });

    // Initial focus
    tenantIdInput.focus();
});