const path = require("path");
const fs = require("fs");
const NodeCache = require("node-cache");
const { createCache } = require("../processing/cacheManager");

// Setup server components
const setupServer = (app) => {
  const config = app.locals.config;

  // Set up downloads directory
  app.locals.downloadDir = config.downloadDir;

  // Set up cache
  app.locals.cache = createCache(config.cacheTTL);
  app.locals.cacheEnabled = config.cacheEnabled;

  // Set up user agent rotation
  app.locals.userAgentRotation = config.userAgentRotation;
  app.locals.userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
  ];

  // If custom user agent is provided, use it instead of rotation
  if (config.userAgent) {
    app.locals.userAgentRotation = false;
    app.locals.customUserAgent = config.userAgent;
  }

  // Set default options
  app.locals.defaultOptions = {
    disableJs: config.disableJs,
    contentFilter: config.contentFilter, // none, low, medium, high
  };

  console.log("Server components initialized");
};

module.exports = {
  setupServer,
};
