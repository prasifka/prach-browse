const express = require("express");
const { handleBrowseRequest } = require("./handlers/browseHandler");
const { handleSearchRequest } = require("./handlers/searchHandler");
const { handleDownloadRequest } = require("./handlers/downloadHandler");
const { parseUrl } = require("../processing/urlProcessor");

const path = require("path");
const fs = require("fs");

// Setup application routes
const setupRoutes = (app) => {
  // Home route - renders the main interface
  app.get("/", (req, res) => {
    res.render("index", {
      title: "Prach Browse",
      url: "",
      content: null,
      error: null,
    });
  });

  // Browse route - handles URL browsing requests
  app.get("/browse", handleBrowseRequest);
  app.post("/browse", handleBrowseRequest);

  // Search route - handles search queries
  app.get("/search", handleSearchRequest);
  app.post("/search", handleSearchRequest);

  // Download route - handles file downloads
  app.get("/download", handleDownloadRequest);

  // Settings route - renders settings page
  app.get("/settings", (req, res) => {
    res.render("settings", {
      title: "Settings - Prach Browse",
      settings: {
        disableJs: app.locals.defaultOptions.disableJs,
        contentFilter: app.locals.defaultOptions.contentFilter,
        userAgentRotation: app.locals.userAgentRotation,
      },
    });
  });

  // Update settings route
  app.post("/settings", (req, res) => {
    const { disableJs, contentFilter, userAgentRotation } = req.body;

    app.locals.defaultOptions.disableJs = disableJs === "on";
    app.locals.defaultOptions.contentFilter = contentFilter || "none";
    app.locals.userAgentRotation = userAgentRotation === "on";

    res.redirect("/settings");
  });

  app.get("/clear-cache", (req, res) => {
    res.redirect("/settings");
  })

  // Clear cache route
  app.post("/clear-cache", (req, res) => {
    if (app.locals.cache) {
      app.locals.cache.flushAll();
      console.log("Cache cleared manually.");
    }
    res.redirect("/settings");
  });

  // About route
  app.get("/about", (req, res) => {
    res.render("about", {
      title: "About - Prach Browse",
    });
  });

  app.get("*.js", (req, res, next) => {
    const jsFilePath = path.join(__dirname, "..", "public", req.path);

    if (fs.existsSync(jsFilePath)) {
      res.set("Content-Type", "application/javascript; charset=UTF-8");
      fs.createReadStream(jsFilePath).pipe(res);
    } else {
      next();
    }
  });

  app.get("*.css", (req, res, next) => {
    const cssFilePath = path.join(__dirname, "..", "public", req.path);

    if (fs.existsSync(cssFilePath)) {
      res.set("Content-Type", "text/css; charset=UTF-8");
      fs.createReadStream(cssFilePath).pipe(res);
    } else {
      next();
    }
  });

  const {
    handleImageProxy,
    handleMediaProxy,
    handleResourceProxy,
  } = require("./handlers/proxyHandlers");

  // Proxy routes for resources
  app.get("/proxy-image", handleImageProxy);
  app.get("/proxy-media", handleMediaProxy);
  app.get("/proxy-resource", handleResourceProxy);

  // 404 handler
  app.use((req, res) => {
    res.status(404).render("error", {
      title: "Page Not Found",
      message: "The page you requested could not be found.",
      error: { status: 404 },
    });
  });

  console.log("Routes initialized");
};

module.exports = {
  setupRoutes,
};
