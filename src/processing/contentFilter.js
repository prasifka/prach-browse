/**
 * Apply content filtering based on specified level
 * @param {Object} $ - Cheerio instance
 * @param {string} level - Filtering level (none, low, medium, high)
 * @returns {Object} - Modified Cheerio instance
 */
const applyContentFilter = ($, level = "none") => {
  if (level === "none") {
    return $;
  }

  // Apply appropriate filtering based on level
  switch (level) {
    case "low":
      applyLowLevelFiltering($);
      break;
    case "medium":
      applyLowLevelFiltering($);
      applyMediumLevelFiltering($);
      break;
    case "high":
      applyLowLevelFiltering($);
      applyMediumLevelFiltering($);
      applyHighLevelFiltering($);
      break;
    default:
      // No filtering if level is not recognized
      break;
  }

  return $;
};

/**
 * Apply low level content filtering
 * @param {Object} $ - Cheerio instance
 */
const applyLowLevelFiltering = ($) => {
  // Remove common ad elements
  const adSelectors = [
    '[class*="ad-"]',
    '[class*="ads-"]',
    '[class*="advertisement"]',
    '[id*="ad-"]',
    '[id*="ads-"]',
    '[id*="advertisement"]',
    "[data-ad]",
    "[data-ads]",
    ".advert",
    ".advertisement",
    ".banner-ad",
    ".sponsored-content",
    "ins.adsbygoogle",
  ];

  adSelectors.forEach((selector) => {
    $(selector).remove();
  });

  // Remove iframe ads
  $("iframe").each((i, el) => {
    const src = $(el).attr("src") || "";
    if (
      src.includes("doubleclick.net") ||
      src.includes("googleadservices") ||
      src.includes("ad.") ||
      src.includes("ads.") ||
      src.includes("banner")
    ) {
      $(el).remove();
    }
  });
};

/**
 * Apply medium level content filtering
 * @param {Object} $ - Cheerio instance
 */
const applyMediumLevelFiltering = ($) => {
  // Remove popups, newsletters, and social media elements
  const mediumSelectors = [
    '[class*="popup"]',
    '[class*="modal"]',
    '[class*="newsletter"]',
    '[class*="subscribe"]',
    '[class*="social-share"]',
    '[class*="social-media"]',
    '[class*="follow-us"]',
    ".popup",
    ".modal",
    ".newsletter",
    ".subscribe",
    ".social-share",
    ".social-media",
    ".follow-us",
    ".cookie-notice",
    ".cookie-banner",
    ".gdpr",
    ".consent",
  ];

  mediumSelectors.forEach((selector) => {
    $(selector).remove();
  });

  // Remove elements with specific roles
  $('[role="dialog"]').remove();
  $('[role="alert"]').remove();

  // Remove fixed position elements (often popups or sticky elements)
  $("*").each((i, el) => {
    const style = $(el).attr("style") || "";
    if (
      style.includes("position: fixed") ||
      style.includes("position:fixed") ||
      style.includes("z-index: 999") ||
      style.includes("z-index:999")
    ) {
      $(el).remove();
    }
  });
};

/**
 * Apply high level content filtering
 * @param {Object} $ - Cheerio instance
 */
const applyHighLevelFiltering = ($) => {
  // Remove comments, related content, recommendations, and sidebars
  const highSelectors = [
    '[class*="comment"]',
    '[class*="related"]',
    '[class*="recommendation"]',
    '[class*="suggested"]',
    '[class*="sidebar"]',
    '[class*="widget"]',
    ".comment",
    ".comments",
    ".related",
    ".recommendation",
    ".suggested",
    ".sidebar",
    ".widget",
    "aside",
    ".aside",
    ".trending",
    ".popular",
    ".most-read",
    ".most-shared",
  ];

  highSelectors.forEach((selector) => {
    $(selector).remove();
  });

  // Remove external embeds
  $("iframe").each((i, el) => {
    const src = $(el).attr("src") || "";
    if (
      src.includes("youtube.com") ||
      src.includes("vimeo.com") ||
      src.includes("facebook.com") ||
      src.includes("twitter.com") ||
      src.includes("instagram.com") ||
      src.includes("tiktok.com")
    ) {
      // Replace with a link to the content instead of embedding it
      const embedLink = `<div class="prach-embed-placeholder">
        <p>External content embed (blocked for privacy)</p>
        <a href="${src}" target="_blank" rel="noopener noreferrer">View content directly</a>
      </div>`;
      $(el).replaceWith(embedLink);
    }
  });

  // Add CSS to hide potentially missed elements
  $("head").append(`
    <style>
      /* Hide potential tracking or annoying elements that might be missed */
      [class*="cookie"], 
      [class*="consent"],
      [class*="notification"],
      [class*="sticky"],
      [id*="cookie"],
      [id*="consent"],
      [id*="notification"],
      [id*="sticky"] {
        display: none !important;
      }
    </style>
  `);
};

module.exports = {
  applyContentFilter,
};
