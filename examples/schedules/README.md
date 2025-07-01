# Configuration & Scheduling Application

A modern, responsive web application for configuring tenant settings and scheduling video meetings with real-time availability checking and interactive time slot selection.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Scheduling Process](#scheduling-process)
- [API Integration](#api-integration)
- [User Interface Components](#user-interface-components)
- [File Structure](#file-structure)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Support](#support)

## Overview

The Configuration & Scheduling Application provides a streamlined interface for users to configure their VideoEngager tenant settings and schedule video meetings. The application features a two-step process: first configuring the tenant connection, then enabling an interactive scheduling form with real-time availability checking.

**Key Technologies:**
- Vanilla JavaScript (ES6+)
- CSS3 with responsive design
- Fetch API for HTTP requests
- Custom time slot picker component

## Features

### ✅ Core Functionality
- **Two-Phase Configuration** - Separate tenant setup and scheduling workflows
- **Real-time Availability** - Dynamic loading of available time slots
- **Interactive Time Picker** - Custom calendar and time slot selection
- **Form Validation** - Comprehensive client-side validation with real-time feedback
- **Responsive Design** - Mobile-friendly interface that works on all devices
- **Connection Testing** - Automatic API connection verification
- **Success Notifications** - Rich success messages with action buttons

### ✅ Advanced Features
- **Auto-refresh Availability** - Updates time slots after successful bookings
- **Calendar Integration** - Google Calendar and ICS file generation
- **Error Handling** - Graceful error handling with user-friendly messages
- **Loading States** - Visual feedback during API operations
- **Accessibility** - Keyboard navigation and screen reader support

## Getting Started

### Prerequisites

- Modern web browser (Chrome 60+, Firefox 55+, Safari 12+, Edge 79+)
- Access to a VideoEngager API endpoint
- Valid tenant ID credentials

### Installation

1. **Download the application files:**
   ```
   index.html
   styles.css
   script.js
   schedule-manager.js
   time-slot-picker.js
   ```

2. **Host the files on a web server:**
   ```bash
   # Using Python (for development)
   python -m http.server 8000
   
   # Using Node.js (for development)
   npx serve .
   ```

3. **Open in browser:**
   ```
   http://localhost:8000
   ```

### Quick Start

1. **Configure Tenant Settings:**
   - Enter your Tenant ID
   - Provide the API Endpoint URL
   - Click "Save Configuration"

2. **Schedule a Meeting:**
   - Fill in personal information
   - Select an available date and time
   - Submit the scheduling form

## Configuration

### Tenant Configuration

The first step requires configuring your tenant connection:

#### Required Fields

| Field | Description | Example | Validation |
|-------|-------------|---------|------------|
| **Tenant ID** | Your unique tenant identifier | `my-company-123` | 3+ characters, alphanumeric with hyphens/underscores |
| **Endpoint URL** | API base URL for your tenant | `https://videome.leadsecure.com` | Valid HTTP/HTTPS URL |

#### Configuration Process

1. **Enter Credentials:**
   ```
   Tenant ID: your-tenant-id
   Endpoint URL: https://your-endpoint.com
   ```

2. **Save Configuration:**
   - Validates input fields
   - Configures the ScheduleManager instance
   - Tests API connection
   - Enables scheduling form if successful


### API Endpoints

The application connects to these VideoEngager API endpoints:

#### Get Availability
```
GET {endpoint}/api/genesys/callback/{tenantId}/availability
```

**Parameters:**
- `start` - Start date (ISO 8601)
- `number-of-days` - Days to check (default: 30)

#### Create Callback
```
POST {endpoint}/api/genesys/callback/{tenantId}
```

**Request Body:**
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "customer_number": "+1234567890",
  "customer_email": "john@example.com",
  "tennantId": "tenant-id",
  "_desired_time": "2024-01-15T14:00:00.000Z"
}
```

## Scheduling Process

### Personal Information

Required fields for scheduling a meeting:

| Field | Description | Validation |
|-------|-------------|------------|
| **First Name** | Customer's first name | 2+ characters |
| **Last Name** | Customer's last name | 2+ characters |
| **Email** | Valid email address | Standard email format |
| **Phone Number** | Contact phone number | 10+ digits with optional formatting |
| **Desired Time** | Selected time slot | Must be from available slots |

### Time Slot Selection

The application features a custom time slot picker with:

#### Calendar Component
- **Available Dates** - Shows dates with available time slots
- **Visual Indicators** - Number of available slots per date
- **Date Selection** - Click to view time slots for that date

#### Time Slots Component
- **Available Times** - Shows all available time slots for selected date
- **Real-time Updates** - Automatically refreshes after bookings
- **Visual Selection** - Clear indication of selected time slot

#### Usage Flow
```
1. Click "Select date and time" input
2. Choose an available date from calendar
3. Select a specific time slot
4. Time is automatically populated in form
5. Popup closes automatically
```

### Booking Confirmation

Upon successful booking, users receive:

#### Success Message
- **Meeting Details** - Date, time, and attendee information
- **Meeting Code** - Unique identifier for the session
- **Action Buttons** - Quick access to meeting tools

#### Available Actions
- **Join Video Meeting** - Direct link to video session
- **Add to Google Calendar** - Automated calendar event creation
- **Download ICS File** - Calendar file for other applications

## API Integration

### ScheduleManager Class

The `ScheduleManager` class handles all API interactions:

#### Core Methods

```javascript
// Configure the manager
scheduleManager.configure(endpointUrl, tenantId);

// Get available time slots
const availability = await scheduleManager.getAvailability(startDate, numberOfDays);

// Book a callback appointment
const booking = await scheduleManager.bookCallback(bookingData);

// Test API connection
const test = await scheduleManager.testConnection();
```

#### Error Handling

```javascript
try {
  const result = await scheduleManager.bookCallback(data);
  
  if (result.success) {
    // Handle success
    showBookingSuccess(result);
  } else {
    // Handle API error
    showBookingError(result.error);
  }
} catch (error) {
  // Handle network error
  showBookingError(error.message);
}
```

### TimeSlotPicker Class

Custom component for time slot selection:

#### Key Features
- **Real-time Data Processing** - Converts API responses to user-friendly format
- **Timezone Handling** - Automatic local timezone conversion
- **Interactive Selection** - Click-based date and time selection
- **Validation Integration** - Seamless form validation support

#### Methods

```javascript
// Enable/disable the picker
timeSlotPicker.enable();
timeSlotPicker.disable();

// Load and render time slots
timeSlotPicker.renderTimeSlots(availabilityData);

// Get selected slot information
const selected = timeSlotPicker.getSelectedSlot();

// Validate selection
const isValid = timeSlotPicker.isValid();
```

## User Interface Components

### Form Validation

#### Real-time Validation
- **On Blur Events** - Validates fields when user leaves input
- **Visual Feedback** - Red borders and error messages for invalid fields
- **Success States** - Green indicators for valid inputs

#### Error Messages
```javascript
// Show/hide validation errors
showError(inputElement, errorId, shouldShow);
```

### Loading States

#### Button States
- **Normal** - Default button appearance
- **Loading** - Spinner animation with "Loading..." text
- **Success** - Green background with checkmark
- **Error** - Red background with warning icon

#### Form States
- **Disabled** - Readonly inputs until configuration complete
- **Enabled** - Interactive form after successful configuration
- **Submitting** - Loading state during API calls

### Responsive Design

#### Mobile Optimization
- **Flexible Layouts** - Grid systems that adapt to screen size
- **Touch-friendly** - Large click targets for mobile devices
- **Readable Typography** - Appropriate font sizes for all screens

#### Desktop Features
- **Hover Effects** - Interactive feedback for mouse users
- **Keyboard Navigation** - Full keyboard accessibility
- **Wide Layout** - Efficient use of larger screens

## File Structure

```
configuration-scheduling/
├── index.html                 # Main HTML structure
├── styles.css                 # Complete styling (not provided)
├── script.js                  # Main application logic and event handlers
├── schedule-manager.js         # API integration and booking management
└── time-slot-picker.js         # Custom time slot selection component
```

### Component Architecture

#### Core Components
1. **Main Application** (`script.js`)
   - Form validation and event handling
   - UI state management
   - Success/error message display

2. **Schedule Manager** (`schedule-manager.js`)
   - API communication
   - Configuration management
   - Connection testing

3. **Time Slot Picker** (`time-slot-picker.js`)
   - Calendar rendering
   - Time slot selection
   - Data processing

#### Data Flow
```
User Input → Validation → API Call → Response Processing → UI Update
```

## Development

### Code Organization

#### ES6 Classes
```javascript
class ScheduleManager {
  constructor() { /* initialization */ }
  async bookCallback(data) { /* API call */ }
  configure(url, id) { /* setup */ }
}
```

#### Event-Driven Architecture
```javascript
// Form submissions
tenantForm.addEventListener('submit', handleTenantConfig);
schedulingForm.addEventListener('submit', handleScheduling);

// Real-time validation
input.addEventListener('blur', validateField);
```

### Validation Patterns

#### Input Validation
```javascript
function validateTenantId(value) {
  return value.trim().length >= 3 && /^[a-zA-Z0-9\-_]+$/.test(value.trim());
}

function validateEmail(value) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value.trim());
}
```

#### Form State Management
```javascript
function enableSchedulingForm() {
  // Remove readonly attributes
  inputs.forEach(input => input.removeAttribute('readonly'));
  
  // Enable time picker
  timeSlotPicker.enable();
  
  // Load availability
  loadAvailableTimeSlots();
}
```

### Customization

#### Styling Customization
1. **CSS Variables** - Modify color schemes and spacing
2. **Responsive Breakpoints** - Adjust mobile/desktop layouts
3. **Animation Timing** - Customize transition speeds

#### Functionality Extension
1. **Additional Validation** - Add custom validation rules
2. **Extra Fields** - Include additional form fields
3. **Custom Actions** - Add new post-booking actions

### Browser Compatibility

#### Required Features
- **Fetch API** - For HTTP requests
- **ES6 Classes** - For component architecture
- **CSS Grid/Flexbox** - For responsive layouts
- **Local Storage** - For session management (if implemented)

#### Polyfills
For older browsers, consider including:
- Fetch polyfill
- Promise polyfill
- CSS Grid polyfill

## Troubleshooting

### Common Issues

#### Configuration Problems

**Issue:** "Connection test failed"
```
Possible Causes:
- Invalid endpoint URL
- Network connectivity issues
- Incorrect tenant ID
- API server unavailable

Solutions:
- Verify URL format (https://domain.com)
- Check network connection
- Confirm tenant ID with administrator
- Test API endpoint separately
```

**Issue:** "No available time slots"
```
Possible Causes:
- No availability in next 30 days
- API returning empty response
- Timezone conversion issues

Solutions:
- Check availability directly via API
- Verify tenant configuration
- Contact support for availability setup
```

#### Booking Problems

**Issue:** "Booking failed"
```
Common Errors:
- Invalid phone number format
- Past time slot selected
- Required fields missing
- API server error

Debugging Steps:
1. Check browser console for detailed errors
2. Verify all form fields are filled correctly
3. Ensure selected time slot is in the future
4. Test with different phone number formats
```

#### UI Issues

**Issue:** Time picker not opening
```
Possible Causes:
- Form not properly enabled
- JavaScript errors
- CSS styling conflicts

Solutions:
- Check browser console for errors
- Verify tenant configuration completed
- Test with different browsers
```

### Debugging

#### Console Logging
The application includes comprehensive logging:

```javascript
// Configuration logging
console.log('ScheduleManager configured:', { baseUrl, tenantId });

// API request logging
console.log('Making availability request:', { url, method });

// Booking logging
console.log('Callback booking successful:', { bookingData, response });
```

#### Error Reporting
```javascript
// API errors
console.error('Error booking callback:', error);

// Connection errors  
console.warn('Connection test failed:', connectionTest);

// Validation errors
console.log('Form validation failed:', invalidFields);
```

## Support

### Getting Help

- **Documentation:** [VideoEngager API Docs](https://api.videoengager.com)
- **Email Support:** support@videoengager.com
- **GitHub Issues:** [Report Issues](https://github.com/VideoEngager/videoengager.github.io/issues)

### Reporting Issues

When reporting issues, please include:
1. **Browser and version**
2. **Steps to reproduce**
3. **Console error messages**
4. **Network tab information** (for API issues)
5. **Screenshots** (for UI issues)

### Feature Requests

To suggest new features:
1. Describe the use case
2. Explain the expected behavior
3. Provide mockups if applicable
4. Consider backward compatibility

### Contributing

#### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

#### Code Standards
- Use ES6+ JavaScript features
- Follow existing naming conventions
- Include comprehensive error handling
- Add console logging for debugging
- Write clear, self-documenting code

### License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.