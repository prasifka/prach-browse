/**
 * Parse and normalize a URL
 * @param {string} url - URL to parse
 * @returns {Object} - Parsed URL information
 */
const parseUrl = (url) => {
  try {
    // Add http:// prefix if missing
    let normalizedUrl = url.trim();

    // Enhanced search query detection
    const isSearchQuery =
      !normalizedUrl.includes("://") &&
      !normalizedUrl.startsWith("www.") &&
      !normalizedUrl.startsWith("ftp.") &&
      (normalizedUrl.includes(" ") || // Contains spaces
        (!normalizedUrl.includes(".") && normalizedUrl.length > 0) || // No dots (probably search)
        /^[a-zA-Z0-9\s\-_]+$/.test(normalizedUrl)); // Only contains alphanumeric, spaces, hyphens, underscores

    if (isSearchQuery) {
      return {
        valid: true,
        isSearchQuery: true,
        normalizedUrl: `/search?q=${encodeURIComponent(normalizedUrl)}`,
        title: `Search: ${normalizedUrl}`,
      };
    }

    // Add protocol if missing but looks like a URL
    if (!normalizedUrl.includes("://")) {
      // Check if it looks like a domain
      if (
        normalizedUrl.includes(".") ||
        normalizedUrl.startsWith("localhost")
      ) {
        normalizedUrl = "http://" + normalizedUrl;
      } else {
        // Treat as search query
        return {
          valid: true,
          isSearchQuery: true,
          normalizedUrl: `/search?q=${encodeURIComponent(normalizedUrl)}`,
          title: `Search: ${normalizedUrl}`,
        };
      }
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

    // If URL parsing failed, treat as search query
    return {
      valid: true,
      isSearchQuery: true,
      normalizedUrl: `/search?q=${encodeURIComponent(url.trim())}`,
      title: `Search: ${url.trim()}`,
    };
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
    // Handle data URLs
    if (relativeUrl.startsWith("data:")) {
      return relativeUrl;
    }

    // Handle protocol-relative URLs
    if (relativeUrl.startsWith("//")) {
      const baseUrlObj = new URL(baseUrl);
      return `${baseUrlObj.protocol}${relativeUrl}`;
    }

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
