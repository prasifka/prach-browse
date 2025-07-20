const cheerio = require("cheerio");
const { resolveUrl } = require("./urlProcessor");
const { applyTrackingPrevention } = require("./trackingPrevention");
const { applyContentFilter } = require("./contentFilter");

/**
 * Process HTML content
 * @param {string} html - Raw HTML content
 * @param {string} baseUrl - Base URL for resolving relative URLs
 * @param {Object} options - Processing options
 * @returns {string} - Processed HTML content
 */
const processHtml = async (html, baseUrl, options = {}) => {
  try {
    const $ = cheerio.load(html);

    // Remove existing CSP headers
    $('meta[http-equiv="Content-Security-Policy"]').remove();

    // Remove JavaScript if disabled
    if (options.disableJs) {
      $("script").remove();
      $("*").each((i, el) => {
        const attribs = $(el).attr();
        for (const attr in attribs) {
          if (attr.startsWith("on")) {
            $(el).removeAttr(attr);
          }
        }
      });
    }

    // Apply tracking prevention
    applyTrackingPrevention($);

    // Apply content filtering
    if (options.contentFilter && options.contentFilter !== "none") {
      applyContentFilter($, options.contentFilter);
    }

    // Process all links first
    $("a[href]").each((i, el) => {
      const href = $(el).attr("href");

      // Skip javascript:, mailto:, tel:, and anchor links
      if (
        !href ||
        href.startsWith("javascript:") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#")
      ) {
        return;
      }

      try {
        // Resolve to absolute URL
        const absoluteUrl = resolveUrl(href, baseUrl);

        // Determine if this link likely points to a downloadable file
        const downloadExtensions = [
          ".zip",
          ".rar",
          ".7z",
          ".tar",
          ".gz",
          ".pdf",
          ".doc",
          ".docx",
          ".xls",
          ".xlsx",
          ".ppt",
          ".pptx",
          ".jpg",
          ".jpeg",
          ".png",
          ".gif",
          ".mp4",
          ".mp3",
        ];

        const lowerUrl = absoluteUrl.toLowerCase();
        const isDownload = downloadExtensions.some((ext) =>
          lowerUrl.endsWith(ext)
        );

        // Route through appropriate handler
        if (isDownload) {
          $(el).attr(
            "href",
            `/download?url=${encodeURIComponent(absoluteUrl)}`
          );
        } else {
          $(el).attr("href", `/browse?url=${encodeURIComponent(absoluteUrl)}`);
        }

        // Ensure links open in the same frame
        $(el).attr("target", "_self");
      } catch (error) {
        console.error(`Error processing link ${href}:`, error.message);
      }
    });

    // Process forms
    $("form").each((i, el) => {
      const action = $(el).attr("action") || "";
      const method = ($(el).attr("method") || "get").toLowerCase();

      if (action && !action.startsWith("javascript:")) {
        try {
          const absoluteUrl = resolveUrl(action, baseUrl);

          // Don't change the method - preserve GET/POST
          $(el).attr("action", "/browse");

          // Add hidden field with the original action URL
          $(el).append(
            `<input type="hidden" name="_original_url" value="${encodeURIComponent(
              absoluteUrl
            )}">`
          );

          // Add hidden field with the original method
          $(el).append(
            `<input type="hidden" name="_original_method" value="${method}">`
          );

          // Add hidden field to indicate this is a form submission
          $(el).append(`<input type="hidden" name="_form_submit" value="1">`);

          // For GET forms, we need to ensure they submit as POST to our handler
          // but we'll convert back to GET when making the actual request
          if (method === "get") {
            $(el).attr("method", "post");
          }

          console.log(`Processed form: ${action} (${method}) -> /browse`);
        } catch (error) {
          console.error(`Error processing form ${action}:`, error.message);
        }
      }
    });

    // Proxy script src
    $("script[src]").each((i, el) => {
      const src = $(el).attr("src");
      if (src && !src.startsWith("data:") && !src.startsWith("/proxy-")) {
        try {
          const absoluteUrl = resolveUrl(src, baseUrl);
          $(el).attr(
            "src",
            `/proxy-resource?url=${encodeURIComponent(absoluteUrl)}`
          );
        } catch (error) {
          console.error(`Error processing script ${src}:`, error.message);
        }
      }
    });

    // Proxy external stylesheets
    $('link[rel="stylesheet"][href]').each((i, el) => {
      const href = $(el).attr("href");
      if (href && !href.startsWith("data:") && !href.startsWith("/proxy-")) {
        try {
          const absoluteUrl = resolveUrl(href, baseUrl);
          $(el).attr(
            "href",
            `/proxy-resource?url=${encodeURIComponent(absoluteUrl)}`
          );
        } catch (error) {
          console.error(`Error processing stylesheet ${href}:`, error.message);
        }
      }
    });

    // Proxy other linked resources (fonts, icons, etc.)
    $("link[href]:not([rel='stylesheet'])").each((i, el) => {
      const href = $(el).attr("href");
      if (
        href &&
        !href.startsWith("data:") &&
        !href.startsWith("/proxy-") &&
        !href.startsWith("#")
      ) {
        try {
          const absoluteUrl = resolveUrl(href, baseUrl);
          $(el).attr(
            "href",
            `/proxy-resource?url=${encodeURIComponent(absoluteUrl)}`
          );
        } catch (error) {
          console.error(
            `Error processing link resource ${href}:`,
            error.message
          );
        }
      }
    });

    // Proxy images
    $("img[src]").each((i, el) => {
      const src = $(el).attr("src");
      if (src && !src.startsWith("data:") && !src.startsWith("/proxy-")) {
        try {
          const absoluteUrl = resolveUrl(src, baseUrl);
          $(el).attr(
            "src",
            `/proxy-image?url=${encodeURIComponent(absoluteUrl)}`
          );
        } catch (error) {
          console.error(`Error processing image ${src}:`, error.message);
        }
      }
    });

    // Proxy media sources
    $("video source[src], audio source[src]").each((i, el) => {
      const src = $(el).attr("src");
      if (src && !src.startsWith("data:") && !src.startsWith("/proxy-")) {
        try {
          const absoluteUrl = resolveUrl(src, baseUrl);
          $(el).attr(
            "src",
            `/proxy-media?url=${encodeURIComponent(absoluteUrl)}`
          );

          // Add download link for media
          $(el).parent().after(`
            <div class="prach-download-link">
              <a href="/download?url=${encodeURIComponent(
                absoluteUrl
              )}" target="_blank">
                Download Media
              </a>
            </div>
          `);
        } catch (error) {
          console.error(`Error processing media ${src}:`, error.message);
        }
      }
    });

    // Proxy video and audio src attributes directly
    $("video[src], audio[src]").each((i, el) => {
      const src = $(el).attr("src");
      if (src && !src.startsWith("data:") && !src.startsWith("/proxy-")) {
        try {
          const absoluteUrl = resolveUrl(src, baseUrl);
          $(el).attr(
            "src",
            `/proxy-media?url=${encodeURIComponent(absoluteUrl)}`
          );

          // Add download link
          $(el).after(`
            <div class="prach-download-link">
              <a href="/download?url=${encodeURIComponent(
                absoluteUrl
              )}" target="_blank">
                Download Media
              </a>
            </div>
          `);
        } catch (error) {
          console.error(`Error processing direct media ${src}:`, error.message);
        }
      }
    });

    // Process CSS background URLs in style tags
    $("style").each((i, el) => {
      let cssContent = $(el).html();
      if (cssContent) {
        const urlRegex = /url\(['"]?([^'"()]+)['"]?\)/g;
        cssContent = cssContent.replace(urlRegex, (match, url) => {
          if (url.startsWith("data:") || url.startsWith("/proxy-")) {
            return match;
          }
          try {
            const absoluteUrl = resolveUrl(url, baseUrl);
            return `url("/proxy-resource?url=${encodeURIComponent(
              absoluteUrl
            )}")`;
          } catch (error) {
            console.error(`Error processing CSS URL ${url}:`, error.message);
            return match;
          }
        });
        $(el).html(cssContent);
      }
    });

    // Process inline style attributes for background images
    $("[style*='url(']").each((i, el) => {
      const style = $(el).attr("style");
      if (style) {
        const urlRegex = /url\(['"]?([^'"()]+)['"]?\)/g;
        const newStyle = style.replace(urlRegex, (match, url) => {
          if (url.startsWith("data:") || url.startsWith("/proxy-")) {
            return match;
          }
          try {
            const absoluteUrl = resolveUrl(url, baseUrl);
            return `url("/proxy-resource?url=${encodeURIComponent(
              absoluteUrl
            )}")`;
          } catch (error) {
            console.error(
              `Error processing inline CSS URL ${url}:`,
              error.message
            );
            return match;
          }
        });
        $(el).attr("style", newStyle);
      }
    });

    // Replace semantic HTML5 tags that might cause issues
    $("header").each((i, el) => {
      const attrs = $(el).attr();
      const inner = $(el).html();
      const classAttr = attrs.class
        ? `${attrs.class} proxy-header`
        : "proxy-header";
      delete attrs.class;

      const attrString = Object.entries(attrs)
        .map(([key, value]) => `${key}="${value}"`)
        .join(" ");

      $(el).replaceWith(
        `<div class="${classAttr}" ${attrString}>${inner}</div>`
      );
    });

    $("nav").each((i, el) => {
      const attrs = $(el).attr();
      const inner = $(el).html();
      const classAttr = attrs.class ? `${attrs.class} proxy-nav` : "proxy-nav";
      delete attrs.class;

      const attrString = Object.entries(attrs)
        .map(([key, value]) => `${key}="${value}"`)
        .join(" ");

      $(el).replaceWith(
        `<div class="${classAttr}" ${attrString}>${inner}</div>`
      );
    });

    return $.html();
  } catch (error) {
    console.error("HTML processing error:", error.message);
    return `<div class="prach-error">Error processing content: ${error.message}</div>`;
  }
};

module.exports = {
  processHtml,
};
