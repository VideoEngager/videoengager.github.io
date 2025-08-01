# VideoEngager Genesys API Test Harness

A comprehensive web-based test harness for the VideoEngager Genesys Callback API, providing an intuitive interface to test authentication, callback management, and scheduling functionalities.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Environment Configuration](#environment-configuration)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Usage Guide](#usage-guide)
- [Error Handling](#error-handling)
- [Development](#development)
- [Support](#support)

## Overview

The VideoEngager Genesys API Test Harness is a single-page HTML application that provides a complete testing interface for the VideoEngager Genesys Callback API. It supports multiple authentication methods, comprehensive API endpoint testing, and real-time response visualization.

**Live Demo:** [https://videoengager.github.io/examples/genesys-schedule-api-demo](https://videoengager.github.io/examples/genesys-schedule-api-demo)

## Features

- ✅ **Multiple Authentication Methods** - Local login and PAK authentication
- ✅ **Environment Switching** - Development, Staging, and Production environments
- ✅ **Real-time API Testing** - Interactive forms for all API endpoints
- ✅ **Response Visualization** - Formatted JSON responses with status indicators
- ✅ **Public & Authenticated APIs** - Support for both public and tenant-specific endpoints
- ✅ **Legacy API Support** - Backward compatibility with deprecated endpoints
- ✅ **Responsive Design** - Mobile-friendly interface
- ✅ **Loading States** - Visual feedback during API calls

## Environment Configuration

The application supports multiple environments that can be configured via URL parameters:

| Parameter | Environment | Base URL |
|-----------|-------------|----------|
| `?env=dev` | Development | `https://dev.videoengager.com` |
| `?env=staging` | Staging | `https://staging.videoengager.com` |
| `?env=production` | Production | `https://videome.leadsecure.com` |
| *default* | Development | `https://dev.videoengager.com` |

### Example URLs
```
https://videoengager.github.io/examples/genesys-schedule-api-demo?env=dev
https://videoengager.github.io/examples/genesys-schedule-api-demo?env=production
```

## Authentication

The test harness supports two authentication methods:

### 1. Local Authentication

Traditional email/password authentication for VideoEngager users.

**Endpoint:** `POST /auth/local`

**Required Fields:**
- Email
- Password

**Example:**
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

### 2. PAK Authentication

Partner API Key authentication for external integrations.

**Endpoint:** `GET /api/partners/impersonate/{pak}/{externalId}/{email}`

**Required Fields:**
- Partner API Key (PAK)
- External ID
- Email

**URL Pattern:**
```
/api/partners/impersonate/YOUR_PAK/YOUR_EXTERNAL_ID/partner@email.com
```

## API Endpoints

### Public API (No Authentication Required)

#### Get Availability
```
GET /api/genesys/callback/{tenantId}/availability
```

**Parameters:**
- `tenantId` (required) - Tenant identifier
- `start` (optional) - Start date (ISO 8601)
- `number-of-days` (optional) - Number of days (1-30)

### Tenant API (Authentication Required)

#### Create Callback
```
POST /api/genesys/callback/tenant/{tenantId}
```

**Request Body:**
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "_customer_number": "+1234567890",
  "customer_email": "john@example.com",
  "_desired_time": "2024-01-15T10:00:00.000Z",
  "duration": 30,
  "creator": "agent",
  "queueId": "optional-queue-id",
  "scriptId": "optional-script-id"
}
```

#### Delete Callback
```
DELETE /api/genesys/callback/tenant/{tenantId}/{conversationId}
```

#### Delete by Schedule ID
```
DELETE /api/genesys/callback/byScheduleId/tenant/{tenantId}/{scheduleId}
```

#### List Callbacks
```
GET /api/genesys/callback/list/tenant/{tenantId}/{from}/{to}
```

**Query Parameters:**
- `preferedAgent` (optional) - Preferred agent ID
- `orderBy` (optional) - Sort order: `date`, `created`, `name`
- `pageSize` (optional) - Results per page (default: 100)

#### Get Single Callback
```
GET /api/genesys/callback/tenant/{tenantId}/{conversationId}
```

#### Update Callback
```
PATCH /api/genesys/callback/tenant/{tenantId}/{conversationId}
```

**Request Body:**
```json
{
  "date": "2024-01-15T14:00:00.000Z"
}
```

### Legacy API (Deprecated)

#### Create Callback (Legacy)
```
POST /api/genesys/callback
```

**Request Body:**
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "_customer_number": "+1234567890",
  "customer_email": "john@example.com",
  "tennantId": "tenant-id",
  "_desired_time": "2024-01-15T10:00:00.000Z",
  "duration": 30
}
```

## Usage Guide

### Getting Started

1. **Open the Test Harness**
   ```
   https://videoengager.github.io/examples/genesys-schedule-api-demo
   ```

2. **Select Environment** (optional)
   Add `?env=production` for production testing

3. **Authenticate**
   - Choose Local Authentication or PAK Authentication
   - Fill in the required credentials
   - Click the authentication button
   - Look for the green status indicator

4. **Test API Endpoints**
   - Navigate to the desired API section
   - Fill in the required parameters
   - Click the endpoint button
   - View the response in the response section

### Testing Workflow Example

1. **Authenticate using PAK:**
   ```
   PAK Key: YOUR_PARTNER_API_KEY
   External ID: YOUR_EXTERNAL_ID
   Email: partner@company.com
   ```

2. **Get Availability:**
   ```
   Tenant ID: your-tenant-id
   Start Date: 2024-01-15T09:00
   Number of Days: 7
   ```

3. **Create a Callback:**
   ```
   Tenant ID: your-tenant-id
   First Name: John
   Last Name: Doe
   Customer Number: +1234567890
   Customer Email: john@example.com
   Desired Time: 2024-01-15T14:00
   Duration: 30
   ```

4. **List Callbacks:**
   ```
   Tenant ID: your-tenant-id
   From Date: 2024-01-15T00:00
   To Date: 2024-01-22T23:59
   ```

### Response Format

All API responses are displayed in the following format:

**Success Response:**
```
SUCCESS (200)
{
  "id": "callback-id",
  "status": "scheduled",
  "conversation_id": "conv-123",
  ...
}
```

**Error Response:**
```
ERROR (400)
{
  "error": "Invalid tenant ID",
  "message": "The specified tenant ID does not exist"
}
```

## Error Handling

### Common HTTP Status Codes

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid parameters or missing required fields |
| 401 | Unauthorized | Invalid or expired authentication token |
| 403 | Forbidden | Insufficient permissions for the resource |
| 404 | Not Found | Resource or endpoint not found |
| 500 | Internal Server Error | Server-side error occurred |

### Authentication Errors

- **Invalid PAK:** Check that your Partner API Key is correct and active
- **Invalid Credentials:** Verify email and password for local authentication
- **Token Expired:** Re-authenticate to get a new token

### Common Request Errors

- **Missing Tenant ID:** Ensure tenant ID is provided and valid
- **Invalid Date Format:** Use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- **Invalid Duration:** Duration must be a positive integer (minutes)

## Development

### Key Functions

- `makeRequest(method, url, data, queryParams)` - Generic API request handler
- `showResponse(elementId, response, status)` - Response display formatter
- `setButtonLoading(buttonId, isLoading)` - Loading state manager
- `updateAuthStatus(authenticated)` - Authentication status updater

### Customization

To customize the test harness:

1. **Add New Endpoints:** Create new endpoint groups in the HTML structure
2. **Modify Styling:** Update the CSS variables and classes
3. **Extend Functionality:** Add new JavaScript functions following the existing patterns

### Browser Compatibility

- Modern browsers (Chrome 60+, Firefox 55+, Safari 12+, Edge 79+)
- JavaScript ES6+ features required
- Fetch API support required

## Support

### Getting Help

- **Documentation:** [VideoEngager API Docs](https://api.videoengager.com)
- **Email Support:** support@videoengager.com
- **GitHub Issues:** [Report Issues](https://github.com/VideoEngager/videoengager.github.io/issues)

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
