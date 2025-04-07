const cheerio = require('cheerio');
const { resolveUrl } = require('./urlProcessor');
const { applyTrackingPrevention } = require('./trackingPrevention');
const { applyContentFilter } = require('./contentFilter');

/**
 * Process HTML content
 * @param {string} html - Raw HTML content
 * @param {string} baseUrl - Base URL for resolving relative URLs
 * @param {Object} options - Processing options
 * @returns {string} - Processed HTML content
 */
const processHtml = async (html, baseUrl, options = {}) => {
  try {
    // Load HTML into cheerio
    const $ = cheerio.load(html);
    
    // Process based on options
    if (options.disableJs) {
      // Remove script tags
      $('script').remove();
      // Remove onclick, onload, and other event handlers
      $('*').each((i, el) => {
        const attribs = $(el).attr();
        for (const attr in attribs) {
          if (attr.startsWith('on')) {
            $(el).removeAttr(attr);
          }
        }
      });
    }
    
    // Apply tracking prevention
    applyTrackingPrevention($);
    
    // Apply content filtering if enabled
    if (options.contentFilter && options.contentFilter !== 'none') {
      applyContentFilter($, options.contentFilter);
    }
    
    // Process links to route through proxy
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        // Resolve relative URLs
        const absoluteUrl = resolveUrl(href, baseUrl);
        // Replace with proxy URL
        $(el).attr('href', `/browse?url=${encodeURIComponent(absoluteUrl)}`);
      }
    });
    
    // Process forms to route through proxy
    $('form').each((i, el) => {
      const action = $(el).attr('action') || '';
      if (action) {
        // Resolve relative URLs
        const absoluteUrl = resolveUrl(action, baseUrl);
        // Replace with proxy URL
        $(el).attr('action', `/browse?url=${encodeURIComponent(absoluteUrl)}`);
      }
      // Add hidden input for original form action
      $(el).append(`<input type="hidden" name="_prach_original_action" value="${action}">`);
      // Modify method if needed
      $(el).attr('method', 'POST');
    });
    
    // Process images to route through proxy
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      if (src) {
        // Resolve relative URLs
        const absoluteUrl = resolveUrl(src, baseUrl);
        // Replace with proxy URL
        $(el).attr('src', absoluteUrl);
      }
    });
    
    // Add download links for media files
    $('video source, audio source').each((i, el) => {
      const src = $(el).attr('src');
      if (src) {
        // Resolve relative URLs
        const absoluteUrl = resolveUrl(src, baseUrl);
        // Replace with direct URL (media files often need direct access)
        $(el).attr('src', absoluteUrl);
        // Add download link after the media element
        $(el).parent().after(`<div class="prach-download-link">
          <a href="/download?url=${encodeURIComponent(absoluteUrl)}" target="_blank">Download Media</a>
        </div>`);
      }
    });
    
    // Add Prach Browse header
    $('body').prepend(`
      <div class="prach-header">
        <div class="prach-logo">
          <a href="/">Prach Browse</a>
        </div>
        <div class="prach-address-bar">
          <form action="/browse" method="GET">
            <input type="text" name="url" value="${baseUrl}" placeholder="Enter URL or search query">
            <button type="submit">Go</button>
          </form>
        </div>
        <div class="prach-actions">
          <a href="/settings">Settings</a>
          <a href="/about">About</a>
        </div>
      </div>
      <style>
        .prach-header {
          position: sticky;
          top: 0;
          background: #f8f9fa;
          padding: 10px;
          border-bottom: 1px solid #ddd;
          display: flex;
          align-items: center;
          z-index: 1000;
        }
        .prach-logo {
          flex: 0 0 150px;
          font-weight: bold;
        }
        .prach-address-bar {
          flex: 1;
        }
        .prach-address-bar form {
          display: flex;
        }
        .prach-address-bar input {
          flex: 1;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px 0 0 4px;
        }
        .prach-address-bar button {
          padding: 8px 16px;
          background: #4285f4;
          color: white;
          border: none;
          border-radius: 0 4px 4px 0;
          cursor: pointer;
        }
        .prach-actions {
          flex: 0 0 150px;
          text-align: right;
        }
        .prach-actions a {
          margin-left: 10px;
          text-decoration: none;
          color: #4285f4;
        }
        .prach-download-link {
          margin: 5px 0;
          padding: 5px;
          background: #f0f0f0;
          border-radius: 4px;
          display: inline-block;
        }
        .prach-download-link a {
          color: #4285f4;
          text-decoration: none;
        }
      </style>
    `);
    
    // Return processed HTML
    return $.html();
    
  } catch (error) {
    console.error('HTML processing error:', error.message);
    return `<div class="error">Error processing content: ${error.message}</div>`;
  }
};

module.exports = {
  processHtml
};