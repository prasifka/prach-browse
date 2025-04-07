/**
 * Parse and normalize a URL
 * @param {string} url - URL to parse
 * @returns {Object} - Parsed URL information
 */
const parseUrl = (url) => {
  try {
    // Add http:// prefix if missing
    let normalizedUrl = url.trim();

    // Check if it's a search query (no protocol, no www, contains spaces)
    if (
      !normalizedUrl.includes("://") &&
      !normalizedUrl.startsWith("www.") &&
      normalizedUrl.includes(" ")
    ) {
      return {
        valid: true,
        isSearchQuery: true,
        normalizedUrl: `/search?q=${encodeURIComponent(normalizedUrl)}`,
        title: `Search: ${normalizedUrl}`,
      };
    }

    // Add protocol if missing
    if (!normalizedUrl.includes("://")) {
      normalizedUrl = "http://" + normalizedUrl;
    }

    // Parse URL
    const parsedUrl = new URL(normalizedUrl);

    // Validate URL
    if (!parsedUrl.hostname) {
      return { valid: false };
    }

    // Return normalized URL
    return {
      valid: true,
      isSearchQuery: false,
      normalizedUrl: parsedUrl.href,
      hostname: parsedUrl.hostname,
      pathname: parsedUrl.pathname,
      protocol: parsedUrl.protocol,
      title: parsedUrl.hostname,
    };
  } catch (error) {
    console.error("URL parsing error:", error.message);
    return { valid: false };
  }
};

/**
 * Convert relative URLs to absolute URLs
 * @param {string} relativeUrl - Relative URL
 * @param {string} baseUrl - Base URL
 * @returns {string} - Absolute URL
 */
const resolveUrl = (relativeUrl, baseUrl) => {
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch (error) {
    console.error("URL resolution error:", error.message);
    return relativeUrl;
  }
};

module.exports = {
  parseUrl,
  resolveUrl,
};
