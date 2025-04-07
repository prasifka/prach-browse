const path = require("path");
const fs = require("fs");

/**
 * Load and parse configuration from environment variables and command line arguments
 * @returns {Object} - Configuration object
 */
const loadConfig = () => {
  // Default configuration
  const config = {
    port: process.env.PORT || 3000,
    downloadDir: process.env.DOWNLOAD_DIR || "./downloads",
    cacheEnabled: process.env.CACHE_ENABLED === "true",
    cacheTTL: parseInt(process.env.CACHE_TTL || "3600", 10),
    userAgentRotation: process.env.USER_AGENT_ROTATION === "true",
    nodeEnv: process.env.NODE_ENV || "development",
    disableJs: false,
    contentFilter: "none",
  };

  // Parse command line arguments
  const args = parseCommandLineArgs();

  // Override config with command line arguments
  if (args["user-agent"]) {
    config.userAgent = args["user-agent"];
    config.userAgentRotation = false;
  }

  if (args["disable-js"] !== undefined) {
    config.disableJs = true;
  }

  if (args["content-filter"]) {
    config.contentFilter = args["content-filter"];
  }

  if (args["port"]) {
    config.port = parseInt(args["port"], 10);
  }

  if (args["cache-enabled"] !== undefined) {
    config.cacheEnabled = args["cache-enabled"] === "true";
  }

  if (args["cache-ttl"]) {
    config.cacheTTL = parseInt(args["cache-ttl"], 10);
  }

  // Ensure download directory exists
  ensureDownloadDir(config.downloadDir);

  return config;
};

/**
 * Parse command line arguments
 * @returns {Object} - Parsed arguments
 */
const parseCommandLineArgs = () => {
  const args = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    // Handle --key=value format
    if (arg.startsWith("--") && arg.includes("=")) {
      const parts = arg.substring(2).split("=");
      args[parts[0]] = parts[1];
      continue;
    }

    // Handle --key value format
    if (arg.startsWith("--")) {
      const key = arg.substring(2);

      // Check if next argument is a value (not a flag)
      if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
        args[key] = argv[i + 1];
        i++; // Skip next argument as it's the value
      } else {
        // Flag without value
        args[key] = true;
      }
    }
  }

  return args;
};

/**
 * Ensure download directory exists
 * @param {string} dir - Download directory path
 */
const ensureDownloadDir = (dir) => {
  const absolutePath = path.resolve(process.cwd(), dir);

  if (!fs.existsSync(absolutePath)) {
    try {
      fs.mkdirSync(absolutePath, { recursive: true });
      console.log(`Created download directory: ${absolutePath}`);
    } catch (error) {
      console.error(`Error creating download directory: ${error.message}`);
    }
  }
};

/**
 * Get help text for command line arguments
 * @returns {string} - Help text
 */
const getHelpText = () => {
  return `
Prach Browse - A high-performance, privacy-focused server-side browser solution

Usage:
  npm start [options]

Options:
  --port=<number>             Port to run the server on (default: 3000)
  --user-agent=<string>       Custom user agent to use (disables rotation)
  --disable-js                Disable JavaScript processing
  --content-filter=<level>    Content filtering level (none, low, medium, high)
  --cache-enabled=<boolean>   Enable response caching (true, false)
  --cache-ttl=<seconds>       Cache TTL in seconds (default: 3600)
  --help                      Show this help text

Environment Variables:
  PORT                        Port to run the server on
  DOWNLOAD_DIR                Directory for temporary file storage
  CACHE_ENABLED               Enable response caching (true, false)
  CACHE_TTL                   Cache TTL in seconds
  USER_AGENT_ROTATION         Enable rotating user agents (true, false)
  NODE_ENV                    Environment (development, production)

Examples:
  npm start -- --port=8080 --disable-js
  npm start -- --user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  npm start -- --content-filter=medium
  `;
};

module.exports = {
  loadConfig,
  getHelpText,
};
