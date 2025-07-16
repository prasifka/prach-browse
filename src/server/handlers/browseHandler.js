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
    let url = req.query.url || req.body._original_url || req.body.url || "";
    const isFormSubmit = req.body._form_submit === "1";
    const originalMethod = (req.body._original_method || "get").toLowerCase();

    console.log("Browse request:", {
      url,
      isFormSubmit,
      originalMethod,
      method: req.method,
      hasBody: !!req.body,
      bodyKeys: Object.keys(req.body || {}),
    });

    // If no URL provided, redirect to home
    if (!url) {
      return res.redirect("/");
    }

    // Decode URL if it's encoded (this fixes the Google search issue)
    try {
      if (url.includes("%")) {
        const decodedUrl = decodeURIComponent(url);
        console.log(`Decoded URL: ${url} -> ${decodedUrl}`);
        url = decodedUrl;
      }
    } catch (decodeError) {
      console.log(
        "URL doesn't need decoding or decode failed:",
        decodeError.message
      );
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

    // If this is a search query, redirect to search
    if (parsedUrl.isSearchQuery) {
      return res.redirect(parsedUrl.normalizedUrl);
    }

    console.log(`Browsing: ${url}`);

    // Select user agent
    let userAgent = "Prach-Browse/1.0";
    if (req.app.locals.customUserAgent) {
      userAgent = req.app.locals.customUserAgent;
    } else if (req.app.locals.userAgentRotation) {
      userAgent = getRandomUserAgent(req.app.locals.userAgents);
    }

    // Prepare request configuration
    const requestConfig = {
      headers: {
        "User-Agent": userAgent,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: function (status) {
        return status < 500; // Resolve only if the status code is less than 500
      },
    };

    let response;

    if (isFormSubmit) {
      // Handle form submission
      console.log(`Form submission to: ${url} using method: ${originalMethod}`);

      // Prepare form data (exclude our internal fields)
      const formData = { ...req.body };
      delete formData._original_url;
      delete formData._original_method;
      delete formData._form_submit;
      delete formData.url; // Remove our internal url field

      console.log("Form data to submit:", formData);

      if (originalMethod === "get") {
        // For GET forms, append data as query parameters
        const queryParams = new URLSearchParams(formData).toString();
        const separator = url.includes("?") ? "&" : "?";
        const fullUrl = queryParams ? `${url}${separator}${queryParams}` : url;

        console.log(`GET form submission URL: ${fullUrl}`);
        response = await axios.get(fullUrl, requestConfig);
      } else {
        // For POST forms, send as form data
        const urlEncodedData = new URLSearchParams(formData).toString();

        requestConfig.method = "POST";
        requestConfig.headers["Content-Type"] =
          "application/x-www-form-urlencoded";
        requestConfig.headers["Content-Length"] =
          Buffer.byteLength(urlEncodedData);
        requestConfig.data = urlEncodedData;

        console.log(`POST form submission to: ${url}`);
        console.log(`POST data: ${urlEncodedData}`);
        response = await axios(url, requestConfig);
      }
    } else {
      // Regular GET request
      console.log(`Regular GET request to: ${url}`);
      response = await axios.get(url, requestConfig);
    }

    // Handle non-HTML responses
    const contentType = response.headers["content-type"] || "";
    if (!contentType.includes("text/html")) {
      console.log(`Non-HTML response detected: ${contentType}`);

      // For downloads, redirect to download handler
      if (
        contentType.includes("application/") ||
        contentType.includes("video/") ||
        contentType.includes("audio/") ||
        contentType.includes("image/")
      ) {
        return res.redirect(`/download?url=${encodeURIComponent(url)}`);
      }

      // For other content types, try to display as text
      return res.render("browse", {
        title: `${parsedUrl.title || "Browsing"} - Prach Browse`,
        url: url,
        content: `<pre>${response.data}</pre>`,
        error: null,
      });
    }

    // Process HTML content
    const processedContent = await processHtml(response.data, url, {
      disableJs: req.app.locals.defaultOptions.disableJs,
      contentFilter: req.app.locals.defaultOptions.contentFilter,
    });

    // Don't cache form submissions
    const cacheKey = `page:${url}`;
    if (req.app.locals.cacheEnabled && !isFormSubmit) {
      req.app.locals.cache.set(cacheKey, processedContent);
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
    console.error("Error details:", {
      code: error.code,
      response: error.response
        ? {
            status: error.response.status,
            statusText: error.response.statusText,
          }
        : null,
    });

    // Handle specific error types
    let errorMessage = "Error accessing the requested URL";

    if (error.code === "ENOTFOUND") {
      errorMessage = "Website not found. Please check the URL and try again.";
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = "Connection refused. The website may be down.";
    } else if (error.code === "ETIMEDOUT") {
      errorMessage =
        "Request timed out. The website is taking too long to respond.";
    } else if (error.response) {
      errorMessage = `Website returned error ${error.response.status}: ${error.response.statusText}`;
    } else {
      errorMessage = `${errorMessage}: ${error.message}`;
    }

    res.render("index", {
      title: "Prach Browse",
      url: req.query.url || req.body._original_url || req.body.url || "",
      content: null,
      error: errorMessage,
    });
  }
};

module.exports = {
  handleBrowseRequest,
};
