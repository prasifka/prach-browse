const axios = require("axios");
const { parseUrl } = require("../../processing/urlProcessor");
const { processHtml } = require("../../processing/htmlProcessor");
const { getRandomUserAgent } = require("../../processing/userAgentRotator");

/**
 * Handle search requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleSearchRequest = async (req, res) => {
  try {
    // Get search query from query or body
    const query = req.query.q || req.body.q || "";

    // If no query provided, redirect to home
    if (!query) {
      return res.redirect("/");
    }

    // Select user agent
    let userAgent = "Prach-Browse/1.0";
    if (req.app.locals.customUserAgent) {
      userAgent = req.app.locals.customUserAgent;
    } else if (req.app.locals.userAgentRotation) {
      userAgent = getRandomUserAgent(req.app.locals.userAgents);
    }

    // Construct search URL (using DuckDuckGo as an example)
    const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(
      query
    )}`;

    // Check cache if enabled
    if (req.app.locals.cacheEnabled) {
      const cachedContent = req.app.locals.cache.get(searchUrl);
      if (cachedContent) {
        console.log(`Cache hit for search: ${query}`);
        return res.render("search", {
          title: `Search: ${query} - Prach Browse`,
          query: query,
          content: cachedContent,
          error: null,
        });
      }
    }

    // Make request to search engine
    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": userAgent,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      timeout: 10000,
    });

    // Process HTML content
    const processedContent = await processHtml(response.data, searchUrl, {
      disableJs: req.app.locals.defaultOptions.disableJs,
      contentFilter: req.app.locals.defaultOptions.contentFilter,
      isSearchResult: true,
    });

    // Cache the processed content if caching is enabled
    if (req.app.locals.cacheEnabled) {
      req.app.locals.cache.set(searchUrl, processedContent);
    }

    // Render the search page with processed content
    res.render("search", {
      title: `Search: ${query} - Prach Browse`,
      query: query,
      content: processedContent,
      error: null,
    });
  } catch (error) {
    console.error("Search error:", error.message);
    res.render("index", {
      title: "Prach Browse",
      url: "",
      content: null,
      error: `Error performing search: ${error.message}`,
    });
  }
};

module.exports = {
  handleSearchRequest,
};
