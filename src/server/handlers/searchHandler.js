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
    let query = req.query.q || req.body.q || "";

    // If no query provided, redirect to home
    if (!query) {
      return res.redirect("/");
    }

    // Decode query if it's encoded
    try {
      if (query.includes("%")) {
        const decodedQuery = decodeURIComponent(query);
        console.log(`Decoded search query: ${query} -> ${decodedQuery}`);
        query = decodedQuery;
      }
    } catch (decodeError) {
      console.log(
        "Query doesn't need decoding or decode failed:",
        decodeError.message
      );
    }

    // Select user agent - use a more realistic one for search engines
    let userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
    if (req.app.locals.customUserAgent) {
      userAgent = req.app.locals.customUserAgent;
    } else if (req.app.locals.userAgentRotation) {
      userAgent = getRandomUserAgent(req.app.locals.userAgents);
    }

    // Try multiple search engines in order of preference
    const searchEngines = [
      {
        name: "DuckDuckGo",
        url: `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
        headers: {
          "User-Agent": userAgent,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
      },
      {
        name: "Startpage",
        url: `https://www.startpage.com/sp/search?query=${encodeURIComponent(
          query
        )}`,
        headers: {
          "User-Agent": userAgent,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
      },
    ];

    let response = null;
    let searchUrl = null;
    let lastError = null;

    // Try each search engine until one works
    for (const engine of searchEngines) {
      try {
        console.log(`Trying search with ${engine.name}: ${engine.url}`);

        // Check cache first
        if (req.app.locals.cacheEnabled) {
          const cachedContent = req.app.locals.cache.get(engine.url);
          if (cachedContent) {
            console.log(`Cache hit for search: ${query} via ${engine.name}`);
            return res.render("search", {
              title: `Search: ${query} - Prach Browse`,
              query: query,
              content: cachedContent,
              error: null,
            });
          }
        }

        response = await axios.get(engine.url, {
          headers: engine.headers,
          timeout: 15000,
          maxRedirects: 5,
        });

        searchUrl = engine.url;
        console.log(`Search successful with ${engine.name}`);
        break;
      } catch (error) {
        console.log(`Search failed with ${engine.name}:`, error.message);
        lastError = error;
        continue;
      }
    }

    // If all search engines failed
    if (!response) {
      throw lastError || new Error("All search engines failed");
    }

    // Check if we got meaningful content
    if (!response.data || response.data.length < 100) {
      console.log(
        `Received minimal content from search engine, length: ${
          response.data?.length || 0
        }`
      );
      throw new Error("Search engine returned empty or minimal content");
    }

    // Process HTML content
    const processedContent = await processHtml(response.data, searchUrl, {
      disableJs: req.app.locals.defaultOptions.disableJs,
      contentFilter: req.app.locals.defaultOptions.contentFilter,
      isSearchResult: true,
    });

    // Check if processed content is meaningful
    if (!processedContent || processedContent.length < 50) {
      console.log(
        `Processed content is too short: ${processedContent?.length || 0}`
      );
      return res.render("search", {
        title: `Search: ${query} - Prach Browse`,
        query: query,
        content: `<div class="prach-error">
          <h3>Search results could not be processed</h3>
          <p>The search engine returned content that could not be properly displayed.</p>
          <p>Try searching for: <strong>${query}</strong> directly on a search engine.</p>
        </div>`,
        error: null,
      });
    }

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
    console.error("Search error details:", {
      code: error.code,
      response: error.response
        ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data?.substring(0, 200) + "...",
          }
        : null,
    });

    res.render("search", {
      title: `Search: ${query} - Prach Browse`,
      query: query,
      content: `<div class="prach-error">
        <h3>Search Error</h3>
        <p>Unable to perform search for: <strong>${query}</strong></p>
        <p>Error: ${error.message}</p>
        <p>You can try:</p>
        <ul>
          <li>Searching with different terms</li>
          <li>Browsing directly to a search engine like <a href="/browse?url=https://duckduckgo.com">DuckDuckGo</a> or <a href="/browse?url=https://google.com">Google</a></li>
        </ul>
      </div>`,
      error: null,
    });
  }
};

module.exports = {
  handleSearchRequest,
};
