class TimeSlotPicker {
    constructor(displayInputId, hiddenInputId, popupId) {
        this.displayInput = document.getElementById(displayInputId);
        this.hiddenInput = document.getElementById(hiddenInputId);
        this.popup = document.getElementById(popupId);
        this.calendarContainer = document.getElementById('calendar-container');
        this.timeslotsContainer = document.getElementById('timeslots-container');
        this.closeButton = document.getElementById('popup-close');
        
        this.availabilityData = null;
        this.processedDates = [];
        this.selectedDate = null;
        this.selectedSlot = null;
        this.isEnabled = false;
        this.overlay = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Open popup when clicking input
        this.displayInput.addEventListener('click', () => {
            if (this.isEnabled) {
                this.openPopup();
            }
        });

        // Close popup
        this.closeButton.addEventListener('click', () => {
            this.closePopup();
        });

        // Close popup when clicking outside
        document.addEventListener('click', (e) => {
            if (this.popup.style.display === 'block' && 
                !this.popup.contains(e.target) && 
                !this.displayInput.contains(e.target)) {
                this.closePopup();
            }
        });

        // Close popup on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.popup.style.display === 'block') {
                this.closePopup();
            }
        });
    }

    openPopup() {
        if (!this.isEnabled) return;
        
        this.popup.style.display = 'block';
        this.createOverlay();
        
        // Load data if not already loaded
        if (!this.availabilityData) {
            this.showCalendarLoading();
        }
    }

    closePopup() {
        this.popup.style.display = 'none';
        this.removeOverlay();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'popup-overlay';
        this.overlay.addEventListener('click', () => this.closePopup());
        document.body.appendChild(this.overlay);
    }

    removeOverlay() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
            this.overlay = null;
        }
    }

    enable() {
        this.isEnabled = true;
        this.displayInput.disabled = false;
        this.displayInput.classList.add('enabled');
        this.displayInput.placeholder = 'Click to select date and time';
    }

    disable() {
        this.isEnabled = false;
        this.displayInput.disabled = true;
        this.displayInput.classList.remove('enabled');
        this.displayInput.placeholder = 'Please configure tenant first';
        this.closePopup();
    }

    renderTimeSlots(availabilityData) {
        this.availabilityData = availabilityData;
        this.processedDates = this.processAvailabilityData(availabilityData);
        
        if (this.processedDates.length === 0) {
            this.showNoAvailability();
            return;
        }
        
        this.renderCalendar();
        this.showTimeslotsPlaceholder();
    }

    processAvailabilityData(data) {
        const now = new Date();
        const processedDates = new Map();
        
        // Process each time slot
        Object.entries(data).forEach(([timeString, availability]) => {
            const slotTime = new Date(timeString);
            
            // Skip past time slots
            if (slotTime <= now) {
                return;
            }
            
            // Convert to local date
            const localDate = slotTime.toLocaleDateString('en-CA'); // YYYY-MM-DD format
            const localTime = slotTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            
            if (!processedDates.has(localDate)) {
                processedDates.set(localDate, {
                    date: localDate,
                    displayDate: slotTime.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    shortDate: slotTime.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                    }),
                    slots: []
                });
            }
            
            processedDates.get(localDate).slots.push({
                originalTime: timeString,
                localTime: localTime,
                displayTime: localTime,
                available: parseInt(availability) >= 1,
                isPast: slotTime <= now
            });
        });
        
        // Convert to array and filter out dates with no available slots
        const result = Array.from(processedDates.values())
            .filter(dateGroup => dateGroup.slots.some(slot => slot.available && !slot.isPast))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        return result;
    }

    renderCalendar() {
        this.calendarContainer.innerHTML = '';
        
        if (this.processedDates.length === 0) {
            this.calendarContainer.innerHTML = '<div class="calendar-error">No available dates</div>';
            return;
        }
        
        this.processedDates.forEach(dateGroup => {
            const availableSlots = dateGroup.slots.filter(slot => slot.available && !slot.isPast);
            
            if (availableSlots.length === 0) {
                return; // Skip dates with no available slots
            }
            
            const dateElement = document.createElement('div');
            dateElement.className = 'date-option';
            dateElement.dataset.date = dateGroup.date;
            
            dateElement.innerHTML = `
                <div class="date-main">${dateGroup.shortDate}</div>
                <div class="date-detail">${availableSlots.length} slots available</div>
            `;
            
            dateElement.addEventListener('click', () => {
                this.selectDate(dateGroup, dateElement);
            });
            
            this.calendarContainer.appendChild(dateElement);
        });
    }

    selectDate(dateGroup, dateElement) {
        // Remove previous selection
        const previousSelected = this.calendarContainer.querySelector('.date-option.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }
        
        // Select new date
        dateElement.classList.add('selected');
        this.selectedDate = dateGroup;
        
        // Clear time slot selection
        this.selectedSlot = null;
        this.hiddenInput.value = '';
        this.updateDisplayInput();
        
        // Render time slots for selected date
        this.renderTimeslots(dateGroup);
    }

    renderTimeslots(dateGroup) {
        this.timeslotsContainer.innerHTML = '';
        
        const availableSlots = dateGroup.slots
            .filter(slot => slot.available && !slot.isPast)
            .sort((a, b) => new Date(a.originalTime) - new Date(b.originalTime));
        
        if (availableSlots.length === 0) {
            this.timeslotsContainer.innerHTML = '<div class="no-date-selected">No available times for this date</div>';
            return;
        }
        
        availableSlots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = 'time-slot';
            slotElement.textContent = slot.displayTime;
            slotElement.dataset.originalTime = slot.originalTime;
            slotElement.dataset.displayTime = slot.displayTime;
            
            slotElement.addEventListener('click', () => {
                this.selectTimeSlot(slot, slotElement);
            });
            
            this.timeslotsContainer.appendChild(slotElement);
        });
    }

    selectTimeSlot(slot, slotElement) {
        // Remove previous selection
        const previousSelected = this.timeslotsContainer.querySelector('.time-slot.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }
        
        // Select new slot
        slotElement.classList.add('selected');
        this.selectedSlot = {
            originalTime: slot.originalTime,
            displayTime: slot.displayTime,
            date: this.selectedDate.displayDate,
            shortDate: this.selectedDate.shortDate
        };
        
        // Update hidden input
        this.hiddenInput.value = this.selectedSlot.originalTime;
        
        // Update display input
        this.updateDisplayInput();
        
        // Trigger change event for validation
        this.hiddenInput.dispatchEvent(new Event('change'));
        
        // Auto-close popup after selection
        setTimeout(() => {
            this.closePopup();
        }, 300);
    }

    updateDisplayInput() {
        if (this.selectedSlot) {
            this.displayInput.value = `${this.selectedSlot.shortDate} at ${this.selectedSlot.displayTime}`;
        } else if (this.selectedDate) {
            this.displayInput.value = `${this.selectedDate.shortDate} - Select time`;
        } else {
            this.displayInput.value = '';
        }
    }

    showTimeslotsPlaceholder() {
        this.timeslotsContainer.innerHTML = '<div class="no-date-selected">Select a date to see available times</div>';
    }

    showCalendarLoading() {
        this.calendarContainer.innerHTML = '<div class="calendar-loading">Loading available dates...</div>';
        this.showTimeslotsPlaceholder();
    }

    showNoAvailability() {
        this.calendarContainer.innerHTML = '<div class="calendar-error">No available time slots in the next 30 days</div>';
        this.timeslotsContainer.innerHTML = '<div class="no-date-selected">No available times</div>';
    }

    showError(message) {
        this.calendarContainer.innerHTML = `<div class="calendar-error">Error: ${message}</div>`;
        this.timeslotsContainer.innerHTML = '<div class="no-date-selected">Error loading times</div>';
    }

    showLoading() {
        if (this.popup.style.display === 'block') {
            this.showCalendarLoading();
        }
    }

    reset() {
        this.selectedDate = null;
        this.selectedSlot = null;
        this.hiddenInput.value = '';
        this.displayInput.value = '';
        this.availabilityData = null;
        this.processedDates = [];
        
        if (this.popup.style.display === 'block') {
            this.showCalendarLoading();
        }
    }

    getSelectedSlot() {
        return this.selectedSlot;
    }

    isValid() {
        return this.selectedSlot !== null && this.hiddenInput.value !== '';
    }

    hide() {
        this.closePopup();
        this.disable();
    }
}