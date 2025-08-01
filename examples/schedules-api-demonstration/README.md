# VideoEngager Schedules API Test Harness

A comprehensive web-based testing interface for the VideoEngager Schedules API, providing an intuitive way to test all scheduling endpoints with proper authentication.

## 🚀 Overview

This test harness provides a complete interface for testing the VideoEngager Schedules API, including:
- **Agent API Schedules** - For agents managing their own schedules
- **Tenant API Schedules** - For tenant administrators managing schedules across agents
- **Legacy API** - Deprecated endpoints (included for backward compatibility)
- **Authentication** - Both local login and Partner API Key (PAK) authentication

## 📋 Features

### Authentication Methods
- **Local Authentication**: Email/password login for standard users
- **PAK Authentication**: Partner API Key authentication for external integrations

### Agent API Endpoints
- ✅ Create schedule (`POST /api/schedules/my/`)
- ✅ Get single schedule (`GET /api/schedules/my/{id}`)
- ✅ Update schedule (`PUT /api/schedules/my/{id}`)
- ✅ Delete schedule (`DELETE /api/schedules/my/{id}`)
- ✅ Get schedules by period (`GET /api/schedules/my/{from}/{to}`)

### Tenant API Endpoints
- ✅ Create schedule for tenant (`POST /api/schedules/tenant/`)
- ✅ Get single schedule for tenant (`GET /api/schedules/tenant/{id}`)
- ✅ Update schedule for tenant (`PUT /api/schedules/tenant/{id}`)
- ✅ Delete schedule for tenant (`DELETE /api/schedules/tenant/{id}`)
- ✅ Get schedules by period for tenant (`GET /api/schedules/tenant/{from}/{to}`)

### Legacy API (Deprecated)
- ⚠️ Create schedule (legacy) (`POST /schedules/create`)

## 🛠️ Getting Started

### Prerequisites
- Modern web browser with JavaScript enabled
- Access to VideoEngager API endpoints
- Valid authentication credentials (email/password or PAK)

### Setup
1. Download the HTML file
2. Open in any modern web browser
3. No additional installation required - it's a standalone HTML application

### Configuration
The test harness is pre-configured to use the development environment:
```javascript
const BASE_URL = "https://dev.videoengager.com";
```

To change the target environment, modify the `BASE_URL` variable in the JavaScript section.

## 🔐 Authentication

### Local Authentication
1. Navigate to the "Local Authentication" section
2. Enter your email and password
3. Click "Login"
4. Upon successful authentication, the status indicator will turn green

**Example credentials format:**
- Email: `email@user.email.com`
- Password: `passwd`

### PAK Authentication
1. Navigate to the "PAK Authentication" section
2. Enter your Partner API Key
3. Enter the External ID
4. Enter the partner email
5. Click "Authenticate"

## 📖 API Usage Guide

### Creating a Schedule

#### Agent Schedule
1. Authenticate using either method above
2. Navigate to "Agent API Schedules" → "Create Schedule"
3. Fill in the required fields:
   - **PIN**: Numeric identifier (e.g., 123456)
   - **Date & Time**: Schedule date and time
   - **Duration**: Meeting duration in minutes
   - **Visitor Details**: Name, email, and phone
4. Optionally check "Send Notification Email"
5. Click "Create Schedule"

#### Tenant Schedule
1. Authenticate as a tenant user
2. Navigate to "Tenant API Schedules" → "Create Schedule for Tenant"
3. **Required**: Enter the agent email address
4. Fill in the same fields as agent schedule
5. Click "Create Schedule"

### Managing Existing Schedules

#### Get Schedule
- Enter the schedule ID in the "Schedule ID" field
- Click "Get Schedule" to retrieve details

#### Update Schedule
- Enter the schedule ID
- Modify any fields you want to update
- Click "Update Schedule"

#### Delete Schedule
- Enter the schedule ID
- Optionally check "Send Notification Email"
- Click "Delete Schedule"

### Querying Schedules by Period
1. Set the "From Date & Time" and "To Date & Time"
2. For tenant queries, optionally specify an agent email to filter results
3. Click "Get Schedules"

## 📊 Data Formats

### Schedule Object Structure
```json
{
  "_id": "string",
  "tenant": "string",
  "agentId": "string",
  "pin": 123456,
  "active": true,
  "date": 1672531200000,
  "duration": 30,
  "visitor": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "meetingUrl": "string"
  },
  "agent": {
    "name": "Agent Name",
    "meetingUrl": "string"
  }
}
```

### Create Schedule Payload
```json
{
  "pin": 123456,
  "date": 1672531200000,
  "duration": 30,
  "visitor": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  }
}
```

## 🎯 Response Handling

The test harness displays responses in formatted JSON with color-coded status indicators:
- **Green (SUCCESS)**: HTTP status 200-299
- **Red (ERROR)**: HTTP status 400+

Each response includes:
- Status code
- Full JSON response body
- Timestamp of the request

## ⚠️ Important Notes

### Date Handling
- Dates are handled as Unix timestamps (milliseconds)
- The interface automatically converts datetime-local inputs to timestamps
- Default values are pre-populated for convenience

### Authentication Token
- Authentication tokens are stored in memory for the session
- Tokens are automatically included in subsequent API requests
- Use the "Logout" button to clear authentication

### Deprecated Endpoints
- Legacy API endpoints are marked as deprecated
- These endpoints may be removed in future versions
- Use the new Agent/Tenant API endpoints for new integrations

## Environment Configuration

The application supports multiple environments that can be configured via URL parameters:

| Parameter | Environment | Base URL |
|-----------|-------------|----------|
| `?env=dev` | Development | `https://dev.videoengager.com` |
| `?env=staging` | Staging | `https://staging.videoengager.com` |
| `?env=production` | Production | `https://videome.leadsecure.com` |
| *default* | Development | `https://dev.videoengager.com` |

## 🔧 Troubleshooting

### Common Issues

**Authentication Failed**
- Verify credentials are correct
- Check if the user account exists and is active
- Ensure PAK is valid and has proper permissions

**Schedule Creation Failed**
- Verify all required fields are filled
- Check date format and ensure it's in the future
- Confirm agent email exists (for tenant API)

**Schedule Not Found**
- Verify the schedule ID is correct
- Ensure you have permission to access the schedule
- Check if the schedule has been deleted

### CORS Issues
If you encounter CORS errors when running locally:
1. Use a local web server instead of opening the file directly
2. Or disable CORS in your browser (for testing only)
3. Or deploy to a web server

## 📝 API Documentation

For complete API documentation, refer to the OpenAPI/Swagger specification included with this project. The specification includes:
- Complete endpoint documentation
- Request/response schemas
- Authentication requirements
- Error codes and responses

## 🤝 Support

For API support and questions:
- Email: support@videoengager.com
- Documentation: Refer to the included Swagger specification

## 📄 License

This project is licensed under the MIT License. See [LICENSE.md](LICENSE.md) for details.