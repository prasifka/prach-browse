const axios = require("axios");
const { parseUrl } = require("../../processing/urlProcessor");
const { processHtml } = require("../../processing/htmlProcessor");
const { getRandomUserAgent } = require("../../processing/userAgentRotator");

/**
 * Handle browse requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleBrowseRequest = async (req, res) => {
  try {
    // Get URL from query or body
    let url = req.query.url || req.body.url || "";

    // If no URL provided, redirect to home
    if (!url) {
      return res.redirect("/");
    }

    // Parse and normalize URL
    const parsedUrl = parseUrl(url);
    if (!parsedUrl.valid) {
      return res.render("index", {
        title: "Prach Browse",
        url: url,
        content: null,
        error: "Invalid URL. Please enter a valid URL.",
      });
    }

    url = parsedUrl.normalizedUrl;

    // Check cache if enabled
    if (req.app.locals.cacheEnabled) {
      const cachedContent = req.app.locals.cache.get(url);
      if (cachedContent) {
        console.log(`Cache hit for ${url}`);
        return res.render("browse", {
          title: `${parsedUrl.title || "Browsing"} - Prach Browse`,
          url: url,
          content: cachedContent,
          error: null,
        });
      }
    }

    // Select user agent
    let userAgent = "Prach-Browse/1.0";
    if (req.app.locals.customUserAgent) {
      userAgent = req.app.locals.customUserAgent;
    } else if (req.app.locals.userAgentRotation) {
      userAgent = getRandomUserAgent(req.app.locals.userAgents);
    }

    // Make request to target URL
    const response = await axios.get(url, {
      headers: {
        "User-Agent": userAgent,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        Referer: "https://www.google.com/",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      timeout: 10000,
      maxRedirects: 5,
    });

    // Process HTML content
    const processedContent = await processHtml(response.data, url, {
      disableJs: req.app.locals.defaultOptions.disableJs,
      contentFilter: req.app.locals.defaultOptions.contentFilter,
    });

    // Cache the processed content if caching is enabled
    if (req.app.locals.cacheEnabled) {
      req.app.locals.cache.set(url, processedContent);
    }

    // Render the browse page with processed content
    res.render("browse", {
      title: `${parsedUrl.title || "Browsing"} - Prach Browse`,
      url: url,
      content: processedContent,
      error: null,
    });
  } catch (error) {
    console.error("Browse error:", error.message);
    res.render("index", {
      title: "Prach Browse",
      url: req.query.url || req.body.url || "",
      content: null,
      error: `Error accessing the requested URL: ${error.message}`,
    });
  }
};

module.exports = {
  handleBrowseRequest,
};
