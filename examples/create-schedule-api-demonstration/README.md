# Meeting Scheduler API Documentation

This documentation explains how to use the VideoEngager Meeting Scheduler API for authentication and scheduling meetings with agents.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Schedule Creation](#schedule-creation)
- [Working Example](#working-example)
- [Error Handling](#error-handling)

## Overview

The Meeting Scheduler allows partners to authenticate using PAK (Partner API Key) authentication and create scheduled meetings with agents. This example demonstrates the complete flow from authentication to meeting creation.

**Base URL:** `https://videome.leadsecure.com`

## Authentication

The API supports two authentication methods. In this example, we use **PAK Authentication**.

### PAK Authentication

PAK Authentication allows partners to authenticate using their Partner API Key, External ID, and email.

**Endpoint:** `GET /api/partners/impersonate/{pak}/{externalId}/{email}`

#### Parameters

| Parameter  | Type   | Location | Description     | Required |
| ---------- | ------ | -------- | --------------- | -------- |
| pak        | string | path     | Partner API Key | ✅       |
| externalId | string | path     | External ID     | ✅       |
| email      | string | path     | Partner email   | ✅       |

#### Example Request

```bash
GET https://videome.leadsecure.com/api/partners/impersonate/your-pak-key/your-external-id/partner@email.com
```

#### Example Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODJiMWJmZDk1NDU3OWRjOTk1MDZlNTYiLCJhY2wiOm51bGwsInBhayI6IkRFVjIiLCJpYXQiOjE3NDg5NTQyMTUsImV4cCI6MTc1MTU0NjIxNX0.9nENrPVjmdtMYpJYgnn3ZsIML31kXkWroCz9hF_IZ2s",
  "token_expiration": 0
}
```

### Local Authentication (Alternative)

**Endpoint:** `POST /auth/local`

```json
{
  "email": "email@user.email.com",
  "password": "passwd"
}
```

## Schedule Creation

After successful authentication, you can create scheduled meetings using the tenant API.

**Endpoint:** `POST /api/schedules/tenant/`

### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

### Query Parameters

| Parameter             | Type    | Description                                                   | Required |
| --------------------- | ------- | ------------------------------------------------------------- | -------- |
| agentEmail            | string  | Email of the agent to schedule with                           | ✅       |
| sendNotificationEmail | boolean | Whether to send email notifications to both visitor and agent | ❌       |

### Request Body

```json
{
  "date": 1672531200000,
  "duration": 30,
  "visitor": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890"
  }
}
```

#### Schema

| Field         | Type    | Description                                         | Required |
| ------------- | ------- | --------------------------------------------------- | -------- |
| date          | integer | Meeting start time as Unix timestamp (milliseconds) | ✅       |
| duration      | integer | Meeting duration in minutes                         | ✅       |
| visitor.name  | string  | Visitor's full name                                 | ✅       |
| visitor.email | string  | Visitor's email address                             | ✅       |
| visitor.phone | string  | Visitor's phone number                              | ✅       |

### Example Request

```bash
POST https://videome.leadsecure.com/api/schedules/tenant/?agentEmail=agent@company.com&sendNotificationEmail=true
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "date": 1672531200000,
  "duration": 30,
  "visitor": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890"
  }
}
```

### Example Response

```json
{
  "_id": "schedule-id-123",
  "tenant": "tenant-id",
  "agentId": "agent-id",
  "active": true,
  "date": 1672531200000,
  "duration": 30,
  "visitor": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "meetingUrl": "https://videome.leadsecure.com/visitor/meeting-url"
  },
  "agent": {
    "name": "Agent Smith",
    "meetingUrl": "https://videome.leadsecure.com/ve/code",
    "fullUrl": "https://videome.leadsecure.com/nextjs/callbackDispatcher?params=SCHEDULE_PARAMS"
  }
}
```

## Working Example

The provided HTML form demonstrates the complete authentication and scheduling flow:

### 1. Authentication Flow

```javascript
// PAK Authentication
async function pakLogin() {
  const pak = document.getElementById("pakKey").value;
  const externalId = document.getElementById("pakExternalId").value;
  const email = document.getElementById("pakEmail").value;

  const response = await fetch(
    `https://videome.leadsecure.com/api/partners/impersonate/${pak}/${externalId}/${email}`
  );

  const data = await response.json();
  if (response.ok && data.token) {
    authToken = data.token;
    // Proceed to load agents and show scheduling form
  }
}
```

### 2. Fetch Available Agents

```javascript
async function fetchAgents() {
  const response = await fetch(
    "https://videome.leadsecure.com/api/brokerages/agents",
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  const agents = await response.json();
  // Populate agent dropdown
}
```

### 3. Create Schedule

```javascript
async function createSchedule() {
  const data = {
    date: new Date(document.getElementById("startTime").value).getTime(),
    duration: parseInt(document.getElementById("duration").value),
    visitor: {
      name: document.getElementById("visitorName").value,
      email: document.getElementById("visitorEmail").value,
      phone: document.getElementById("visitorPhone").value,
    },
  };

  const queryParams = {
    agentEmail: document.getElementById("agentSelect").value,
  };

  if (document.getElementById("sendNotificationEmail").checked) {
    queryParams.sendNotificationEmail = true;
  }

  const queryString = new URLSearchParams(queryParams).toString();

  const response = await fetch(
    `https://videome.leadsecure.com/api/schedules/tenant/?${queryString}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  return await response.json();
}
```

### 4. Authenticate the join video meeting agent URL

```javascript
async function joinVideoMeeting(event) {
  event.preventDefault();
  const { currentTarget } = event;
  currentTarget.style.disabled = true;
  currentTarget.textContent = "Joining meeting...";
  const pak = document.getElementById("pakKey").value; // Same PAK Key
  const externalId = document.getElementById("pakExternalId").value; // Same external Id
  const email = currentMeetingData.agentId; // Agent Id that comes from the create schedule response

  const agentUrl = currentMeetingData.agent.fullUrl; // Verify it has the fullUrl
  if (!agentUrl) {
    showError("No full URL available for the agent");
    return;
  }

  try {
    // Authenticate the agent
    const response = await authenticateWithPak(pak, externalId, email); // Get token for the agent that will handle the call

    if (response.status === 200 && response.data.token) {
      // Create URL with token parameter
      const urlWithToken = new URL(agentUrl);
      urlWithToken.searchParams.set("token", response.data.token);

      // Open the agent meeting URL with token in a new tab
      window.open(urlWithToken.toString(), "_blank"); // open a tab with token appended to the params
    } else {
      // Handle authentication failure
      const errorMessage =
        response.data?.error ||
        response.data?.message ||
        `Authentication failed with status ${response.status}`;
      showError("Failed to join meeting: " + errorMessage);
    }
  } catch (error) {
    // Handle network errors or other exceptions
    console.error("Error joining meeting:", error);
    showError(
      "Failed to join meeting: " + (error.message || "Network error occurred")
    );
  } finally {
    // Reset button state
    currentTarget.style.disabled = false;
    currentTarget.textContent = "Join Video Meeting As Agent";
  }
}
```

#### ⚠️ If you don't authenticate the join video meeting agent URL automatically - the agent will be redirected to the login page ⚠️

## Error Handling

### Common HTTP Status Codes

| Status Code | Description  | Common Causes                                         |
| ----------- | ------------ | ----------------------------------------------------- |
| 200         | Success      | Request completed successfully                        |
| 400         | Bad Request  | Invalid request parameters or missing required fields |
| 401         | Unauthorized | Invalid or expired authentication token               |
| 404         | Not Found    | Resource not found                                    |

### Example Error Response

```json
{
  "error": "Invalid agent email",
  "message": "The specified agent email does not exist",
  "status": 400
}
```

### Error Handling in Code

```javascript
try {
  const response = await createSchedule();

  if (response.status === 200 || response.status === 201) {
    // Success - show meeting details
    showResults(response.data);
  } else {
    // Error - show error message
    showError(response.data.error || "Failed to schedule meeting");
  }
} catch (error) {
  // Network error
  showError("Network error: " + error.message);
}
```

## Form Fields Reference

The HTML form includes the following fields:

### Authentication Fields

- **Partner API Key**: Your PAK key for authentication
- **External ID**: Your external identifier
- **Email**: Partner email address

### Meeting Details

- **Agent Selection**: Dropdown populated with available agents
- **Meeting Title**: Title/subject of the meeting
- **Start Date & Time**: When the meeting should start
- **Duration**: Meeting length in minutes (1-480)

### Visitor Information

- **Visitor Name**: Full name of the meeting participant
- **Visitor Email**: Email address for the visitor
- **Visitor Phone**: Phone number for the visitor

### Notification Settings

- **Send Notification Email**: Checkbox to send email notifications to both visitor and agent

## Notes

- All date/time values should be in UTC
- Duration is specified in minutes with a maximum of 480 minutes (8 hours)
- The `sendNotificationEmail` parameter is optional and defaults to false - when enabled, sends notifications to both visitor and agent
- Authentication tokens should be included in the `Authorization` header as `Bearer {token}`
- Agent email must be valid and exist in the system

## Support

For additional support or questions, contact: support@videoengager.com

## License

This project is licensed under the MIT License. See [LICENSE.md](LICENSE.md) for details.
