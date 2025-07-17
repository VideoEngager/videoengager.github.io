/**
 * VideoEngager + Genesys Callback Integration Server
 *
 * This server demonstrates how to integrate VideoEngager video meetings
 * with Genesys Cloud callback scheduling while maintaining data privacy.
 *
 * Architecture:
 * 1. Customer submits form with PII
 * 2. Server stores PII securely and generates anonymous ID
 * 3. Anonymous ID is used for external API calls
 * 4. Video meeting and callback are scheduled simultaneously
 */

const express = require("express");
const path = require("path");
require("dotenv").config();

// Import our modular components
const { setupMiddleware } = require("./middleware/security.js");
const { validateEnvironment } = require("./config/environment.js");
const { VideoEngagerService } = require("./services/videoEngager.js");
const { GenesysService } = require("./services/genesys.js");
const { CustomerDataStore } = require("./storage/customerData.js");
const { logger } = require("./utils/logger.js");
const {
  validateCallbackRequest,
} = require("./validators/callbackValidator.js");

// ====================================================
// SERVER SETUP AND CONFIGURATION
// ====================================================

const app = express();
const PORT = process.env.PORT || 3001;

// Validate all required environment variables before starting
validateEnvironment();

// Setup security middleware, CORS, rate limiting, etc.
setupMiddleware(app);

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, "public")));

// ====================================================
// SERVICES INITIALIZATION
// ====================================================

// Initialize our service classes
const videoEngagerService = new VideoEngagerService();
const genesysService = new GenesysService();
const customerStore = new CustomerDataStore();

// ====================================================
// MAIN API ENDPOINTS
// ====================================================

/**
 * Schedule Callback Endpoint
 *
 * This is the main endpoint that:
 * 1. Validates customer input
 * 2. Stores PII securely
 * 3. Creates anonymous video meeting
 * 4. Schedules callback in Genesys
 * 5. Returns meeting URL and callback confirmation
 */
app.post("/api/schedule-callback", async (req, res) => {
  const requestId = req.requestId; // Added by middleware

  try {
    logger.info("Starting callback scheduling process", { requestId });

    // ============================================
    // STEP 1: VALIDATE INPUT DATA
    // ============================================
    const validationResult = validateCallbackRequest(req.body);
    if (!validationResult.isValid) {
      logger.warn("Invalid request data", {
        requestId,
        errors: validationResult.errors,
      });

      return res.status(400).json({
        error: "Invalid request data",
        details: validationResult.errors,
        requestId,
      });
    }

    const customerData = validationResult.data;
    const customerId = generateCustomerId();

    logger.info("Request validation successful", {
      requestId,
      customerId,
      hasPhone: !!customerData.phoneNumber,
      hasName: !!(customerData.firstName && customerData.lastName),
    });

    // ============================================
    // STEP 2: STORE CUSTOMER DATA SECURELY
    // ============================================
    // Store PII on our servers - never send names to external APIs
    await customerStore.store(customerId, {
      ...customerData,
      createdAt: new Date().toISOString(),
      requestId,
    });

    logger.info("Customer data stored securely", { requestId, customerId });

    // ============================================
    // STEP 3: CREATE VIDEO MEETING (ANONYMOUSLY)
    // ============================================
    // Create VideoEngager meeting using only anonymous customer ID
    const videoMeeting = await videoEngagerService.createMeeting(
      {
        customerId: customerId, // Anonymous ID only
        scheduledTime: customerData.desiredTime,
        duration: 30, // minutes
      },
      requestId
    );

    logger.info("Video meeting created successfully", {
      requestId,
      customerId,
      meetingId: videoMeeting.id,
      videoUrl: videoMeeting.customerUrl,
    });

    // ============================================
    // STEP 4: SCHEDULE GENESYS CALLBACK
    // ============================================
    // Create callback in Genesys - only send required data (phone number)
    const callback = await genesysService.scheduleCallback(
      {
        phoneNumber: customerData.phoneNumber, // Required for callback
        customerId: customerId, // Anonymous reference
        scheduledTime: customerData.desiredTime,
        subject: customerData.subject,
        videoMeetingInfo: {
          meetingId: videoMeeting.id,
          visitorUrl: videoMeeting.customerUrl,
        },
      },
      requestId
    );

    logger.info("Callback scheduled successfully", {
      requestId,
      customerId,
      callbackId: callback.id,
    });

    // ============================================
    // STEP 5: PATCH VE SCHEDULE TO INCLUDE NESSESERY DATA
    // ============================================

    await videoEngagerService.patchCallback(videoMeeting.id, requestId, {
      conversationId: callback?.id,
    });

    // ============================================
    // STEP 6: RETURN SUCCESS RESPONSE
    // ============================================
    const response = {
      success: true,
      customerId: customerId,
      videoUrl: videoMeeting.customerUrl,
      callbackId: callback.id,
      scheduledTime: customerData.desiredTime,
      message: "Callback and video meeting scheduled successfully",
    };

    logger.info("Callback scheduling completed successfully", {
      requestId,
      customerId,
    });

    res.json(response);
  } catch (error) {
    // ============================================
    // ERROR HANDLING
    // ============================================
    logger.error("Error during callback scheduling", {
      requestId,
      error: error.message,
      stack: error.stack,
    });

    // Return user-friendly error message
    res.status(500).json({
      error: getErrorMessage(error),
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Health Check Endpoint
 *
 * Provides system health information and service status
 */
app.get("/api/health", async (req, res) => {
  try {
    // Check external service connectivity
    const [videoEngagerHealth, genesysHealth] = await Promise.all([
      videoEngagerService
        .checkHealth()
        .catch((err) => ({ status: "error", error: err.message })),
      genesysService
        .checkHealth()
        .catch((err) => ({ status: "error", error: err.message })),
    ]);

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: Math.floor(process.uptime()),
      services: {
        videoEngager: videoEngagerHealth,
        genesys: genesysHealth,
      },
    };

    res.json(health);
  } catch (error) {
    logger.error("Health check failed", { error: error.message });

    res.status(503).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Get Customer Data Endpoint (for demo/testing purposes)
 *
 * In production, this should be secured and only accessible
 * to authorized personnel
 */
app.get("/api/customer/:id", async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await customerStore.retrieve(customerId);

    if (!customer) {
      return res.status(404).json({
        error: "Customer not found",
        customerId,
      });
    }

    // Remove sensitive data from response if needed
    const sanitizedCustomer = {
      ...customer,
      // Remove or mask sensitive fields as needed
      phoneNumber: customer.phoneNumber
        ? maskPhoneNumber(customer.phoneNumber)
        : null,
    };

    res.json(sanitizedCustomer);
  } catch (error) {
    logger.error("Error retrieving customer data", {
      customerId: req.params.id,
      error: error.message,
    });

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// ====================================================
// SERVE FRONTEND
// ====================================================

/**
 * Serve the main frontend application
 */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ====================================================
// ERROR HANDLING MIDDLEWARE
// ====================================================

/**
 * Global error handler
 */
app.use((error, req, res, next) => {
  logger.error("Unhandled error", {
    requestId: req.requestId,
    error: error.message,
    stack: error.stack,
  });

  res.status(500).json({
    error: "Internal server error",
    requestId: req.requestId,
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.path,
  });
});

// ====================================================
// UTILITY FUNCTIONS
// ====================================================

/**
 * Generate a unique customer ID
 * In production, use a proper UUID library
 */
function generateCustomerId() {
  return (
    "cust_" + Date.now().toString(36) + Math.random().toString(36).substr(2)
  );
}

/**
 * Convert technical errors to user-friendly messages
 */
function getErrorMessage(error) {
  if (error.message.includes("VideoEngager")) {
    return "Video meeting system is temporarily unavailable. Please try again later.";
  }

  if (error.message.includes("Genesys")) {
    return "Callback system is temporarily unavailable. Please try again later.";
  }

  if (error.message.includes("authentication")) {
    return "Service authentication failed. Please contact support.";
  }

  return "An unexpected error occurred. Please try again later.";
}

/**
 * Mask phone number for logging/display purposes
 */
function maskPhoneNumber(phoneNumber) {
  if (!phoneNumber || phoneNumber.length < 4) return phoneNumber;
  return phoneNumber.slice(0, -4).replace(/\d/g, "*") + phoneNumber.slice(-4);
}

// ====================================================
// SERVER STARTUP
// ====================================================

/**
 * Start the server
 */
app.listen(PORT, () => {
  logger.info("Server started successfully", {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
    videoEngagerDomain: process.env.VE_DOMAIN,
    genesysEnvironment: process.env.GENESYS_ENVIRONMENT,
  });

  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend available at: http://localhost:${PORT}`);
  console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}\n`);
});

// ====================================================
// GRACEFUL SHUTDOWN
// ====================================================

/**
 * Handle graceful shutdown
 */
process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM signal, starting graceful shutdown");

  // Close database connections, cleanup resources, etc.
  await customerStore.close();

  logger.info("Graceful shutdown completed");
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("Received SIGINT signal, starting graceful shutdown");

  // Close database connections, cleanup resources, etc.
  await customerStore.close();

  logger.info("Graceful shutdown completed");
  process.exit(0);
});

module.exports = app;
