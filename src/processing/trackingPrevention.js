/**
 * Apply tracking prevention techniques to HTML content
 * @param {Object} $ - Cheerio instance
 * @returns {Object} - Modified Cheerio instance
 */
const applyTrackingPrevention = ($) => {
  // Remove common tracking scripts
  removeTrackingScripts($);

  // Remove tracking pixels and beacons
  removeTrackingPixels($);

  // Sanitize links from tracking parameters
  sanitizeLinks($);

  // Block third-party cookies
  addCookieBlockingHeaders($);

  return $;
};

/**
 * Remove common tracking scripts
 * @param {Object} $ - Cheerio instance
 */
const removeTrackingScripts = ($) => {
  const trackingScriptPatterns = [
    "google-analytics",
    "googletagmanager",
    "facebook.net",
    "fbevents.js",
    "twitter.com/widgets.js",
    "connect.facebook.net",
    "platform.twitter.com",
    "ads.js",
    "analytics.js",
    "tracking",
    "matomo",
    "piwik",
    "gtm.js",
    "hotjar",
    "clarity.ms",
  ];

  // Remove script tags with tracking URLs
  $("script").each((i, el) => {
    const src = $(el).attr("src") || "";
    if (trackingScriptPatterns.some((pattern) => src.includes(pattern))) {
      $(el).remove();
    }

    // Also check inline scripts
    const content = $(el).html() || "";
    if (trackingScriptPatterns.some((pattern) => content.includes(pattern))) {
      $(el).remove();
    }
  });
};

/**
 * Remove tracking pixels and beacons
 * @param {Object} $ - Cheerio instance
 */
const removeTrackingPixels = ($) => {
  // Common tracking pixel patterns
  const trackingPixelPatterns = [
    "facebook.com/tr",
    "google.com/pixel",
    "pixel.gif",
    "tracker.gif",
    "beacon.gif",
    "analytics.gif",
    "tracking.gif",
    "pixel.php",
    "beacon.php",
  ];

  // Remove img tags with tracking URLs
  $("img").each((i, el) => {
    const src = $(el).attr("src") || "";
    if (trackingPixelPatterns.some((pattern) => src.includes(pattern))) {
      $(el).remove();
    }

    // Also remove 1x1 pixel images (common tracking technique)
    const width = $(el).attr("width");
    const height = $(el).attr("height");
    if (
      (width === "1" && height === "1") ||
      (width === "0" && height === "0")
    ) {
      $(el).remove();
    }
  });
};

/**
 * Sanitize links from tracking parameters
 * @param {Object} $ - Cheerio instance
 */
const sanitizeLinks = ($) => {
  // Common tracking parameters to remove
  const trackingParams = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "fbclid",
    "gclid",
    "dclid",
    "zanpid",
    "msclkid",
    "ref",
    "_hsenc",
    "_hsmi",
    "mc_cid",
    "mc_eid",
  ];

  // Clean links
  $("a").each((i, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("?")) {
      try {
        const url = new URL(href, "http://example.com");
        let modified = false;

        trackingParams.forEach((param) => {
          if (url.searchParams.has(param)) {
            url.searchParams.delete(param);
            modified = true;
          }
        });

        if (modified) {
          let cleanUrl = url.toString();
          // Remove the example.com base if it was added
          cleanUrl = cleanUrl.replace("http://example.com/", "");
          $(el).attr("href", cleanUrl);
        }
      } catch (error) {
        // If URL parsing fails, leave the href unchanged
        console.error("Error sanitizing URL:", error.message);
      }
    }
  });
};

/**
 * Add cookie blocking headers to the HTML
 * @param {Object} $ - Cheerio instance
 */
const addCookieBlockingHeaders = ($) => {
  // Add meta tags to block cookies and tracking
  $("head").prepend(`
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline';">
    <meta name="referrer" content="no-referrer">
  `);
};

module.exports = {
  applyTrackingPrevention,
};
