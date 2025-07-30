# VideoEngager Agent SDK Demo

This demo demonstrates the simplest possible implementation of the VideoEngager Agent SDK. It serves as a basic example with minimal complexity—no error handling is included, and all SDK parameters are passed directly through URL parameters.

## Available Parameters

The following parameters can be configured via URL parameters:

### Required Parameters
- **`apiKey`** - Your API key (required for generic authentication)
- **`agentEmail`** - The agent's email address
- **`domain`** - VideoEngager domain

### Optional Parameters
- **`organizationId`** - Organization identifier

## Usage

Pass the parameters as URL query strings when accessing the demo application.

**Example:**
```
https://your-demo-url.com?apiKey=your-api-key&agentEmail=agent@example.com&domain=your-domain&organizationId=your-org-id
```

## Important Notes

- This is a demonstration implementation intended for learning purposes
- No error handling or validation is implemented
- All parameters are read directly from URL parameters
- For production use, implement proper error handling and security measures


### Getting Help

- **Issues**: [Video Engager Helpdesk](https://help.videoengager.com/hc/en-us/requests/new)
- **Dev Documentation**: [VideoEngager Docs](https://videoengager.github.io/videoengager.widget/#/)
- **User Documentation**: [VideoEngager Helpdesk](https://help.videoengager.com/)
- **Additional SDK Documentation**: [VideoEngager Agent SDK Github](https://github.com/VideoEngager/videoengager-agent-sdk/blob/main/README.md)

For enterprise support and custom integrations, contact VideoEngager Support <a href="mailto:support@videoengager.com">support@videoengager.com</a> directly.

---

## License

This project is licensed under the MIT License. See [LICENSE.md](LICENSE.md) for details.