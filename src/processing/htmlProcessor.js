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

    $('meta[http-equiv="Content-Security-Policy"]').remove();

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

    applyTrackingPrevention($);

    if (options.contentFilter && options.contentFilter !== "none") {
      applyContentFilter($, options.contentFilter);
    }

    // Proxy script src
    $("script[src]").each((i, el) => {
      const src = $(el).attr("src");
      if (src && !src.startsWith("data:")) {
        const absoluteUrl = resolveUrl(src, baseUrl);
        $(el).attr(
          "src",
          `/proxy-resource?url=${encodeURIComponent(absoluteUrl)}`
        );
      }
    });

    // Proxy external stylesheets
    $('link[rel="stylesheet"][href]').each((i, el) => {
      const href = $(el).attr("href");
      if (href && !href.startsWith("data:")) {
        const absoluteUrl = resolveUrl(href, baseUrl);
        $(el).attr(
          "href",
          `/proxy-resource?url=${encodeURIComponent(absoluteUrl)}`
        );
      }
    });

    // Proxy fonts, icons etc. via <link>
    $("link[href]").each((i, el) => {
      const href = $(el).attr("href");
      if (href && !href.startsWith("data:") && !href.startsWith("/proxy-")) {
        const absoluteUrl = resolveUrl(href, baseUrl);
        $(el).attr(
          "href",
          `/proxy-resource?url=${encodeURIComponent(absoluteUrl)}`
        );
      }
    });

    // Proxy all hyperlinks
    $("a").each((i, el) => {
      const href = $(el).attr("href");

      if (!href || href.startsWith("javascript:") || href.startsWith("#")) {
        return;
      }

      const absoluteUrl = resolveUrl(href, baseUrl);
      $(el).attr("href", `/browse?url=${encodeURIComponent(absoluteUrl)}`);
    });

    // Proxy forms
    $("form").each((i, el) => {
      const action = $(el).attr("action") || "";
      if (action && !action.startsWith("javascript:")) {
        const absoluteUrl = resolveUrl(action, baseUrl);
        $(el).attr("action", `/browse?url=${encodeURIComponent(absoluteUrl)}`);
      }
      $(el).append(
        `<input type="hidden" name="_prach_original_action" value="${action}">`
      );
      if (!$(el).attr("method")) {
        $(el).attr("method", "POST");
      }
    });

    // Proxy images
    $("img").each((i, el) => {
      const src = $(el).attr("src");
      if (src && !src.startsWith("data:")) {
        const absoluteUrl = resolveUrl(src, baseUrl);
        $(el).attr(
          "src",
          `/proxy-image?url=${encodeURIComponent(absoluteUrl)}`
        );
      }
    });

    // Proxy media
    $("video source, audio source").each((i, el) => {
      const src = $(el).attr("src");
      if (src && !src.startsWith("data:")) {
        const absoluteUrl = resolveUrl(src, baseUrl);
        $(el).attr(
          "src",
          `/proxy-media?url=${encodeURIComponent(absoluteUrl)}`
        );
        $(el).parent().after(`<div class="prach-download-link">
            <a href="/download?url=${encodeURIComponent(
              absoluteUrl
            )}" target="_blank">Download Media</a>
          </div>`);
      }
    });

    // Proxy CSS background URLs
    $("style").each((i, el) => {
      let cssContent = $(el).html();
      if (cssContent) {
        const urlRegex = /url\(['"]?([^'"()]+)['"]?\)/g;
        cssContent = cssContent.replace(urlRegex, (match, url) => {
          if (url.startsWith("data:")) {
            return match;
          }
          const absoluteUrl = resolveUrl(url, baseUrl);
          return `url("/proxy-resource?url=${encodeURIComponent(
            absoluteUrl
          )}")`;
        });
        $(el).html(cssContent);
      }
    });

    const attrsToString = (attrs, options = {}) => {
      const skip = options.skip || [];
      return Object.entries(attrs)
        .filter(([key]) => !skip.includes(key))
        .map(([key, value]) => `${key}="${value}"`)
        .join(" ");
    };

    // Replace <header> tags
    $("header").each((i, el) => {
      const attrs = $(el).attr();
      const inner = $(el).html();

      const classAttr = ["proxy-header"];
      if (attrs.class) classAttr.push(attrs.class);

      $(el).replaceWith(
        `<div ${attrsToString(attrs, {
          skip: ["class"],
        })} class="${classAttr.join(" ")}">${inner}</div>`
      );
    });

    // Replace <nav> tags
    $("nav").each((i, el) => {
      const attrs = $(el).attr();
      const inner = $(el).html();

      const classAttr = ["proxy-nav"];
      if (attrs.class) classAttr.push(attrs.class);

      $(el).replaceWith(
        `<div ${attrsToString(attrs, {
          skip: ["class"],
        })} class="${classAttr.join(" ")}">${inner}</div>`
      );
    });
    return $.html();
  } catch (error) {
    console.error("HTML processing error:", error.message);
    return `<div class="error">Error processing content: ${error.message}</div>`;
  }
};

module.exports = {
  processHtml,
};
