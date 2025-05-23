require("dotenv").config();

const express = require("express");
const path = require("path");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");

// Import configuration manager
const { loadConfig, getHelpText } = require("./config/configManager");

// Import server components
const { setupServer } = require("./server/server");
const { setupRoutes } = require("./server/routes");

// Check for help flag
if (process.argv.includes("--help")) {
  console.log(getHelpText());
  process.exit(0);
}

// Load configuration
const config = loadConfig();

// Create Express application
const app = express();

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(morgan(config.nodeEnv === "development" ? "dev" : "combined")); // Logging
app.use(helmet({ contentSecurityPolicy: false })); // Security headers
app.use(compression()); // Compress responses
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(bodyParser.json()); // Parse JSON bodies
app.use(cookieParser()); // Parse cookies
app.use(cors()); // Enable CORS

// Static files
app.use(express.static(path.join(__dirname, "public"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    }
  }
}));

// Make config available to all routes
app.locals.config = config;

// Setup server components
setupServer(app);

// Setup routes
setupRoutes(app);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", {
    title: "Error",
    message: "Something went wrong!",
    error: config.nodeEnv === "development" ? err : {},
  });
});

// Start server
app.listen(config.port, "0.0.0.0", () => {
  console.log(`Prach Browse server running on http://0.0.0.0:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Cache enabled: ${config.cacheEnabled}`);
  console.log(`User agent rotation: ${config.userAgentRotation}`);
  if (config.userAgent) {
    console.log(`Custom user agent: ${config.userAgent}`);
  }
  if (config.disableJs) {
    console.log("JavaScript processing: Disabled");
  }
  if (config.contentFilter !== "none") {
    console.log(`Content filtering level: ${config.contentFilter}`);
  }
});

module.exports = app;
