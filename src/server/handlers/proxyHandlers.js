const axios = require("axios");
const { getRandomUserAgent } = require("../../processing/userAgentRotator");
const { parseUrl } = require("../../processing/urlProcessor");

/**
 * Handle image proxy requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleImageProxy = async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).send("Missing URL parameter");
    }

    // Parse and normalize URL
    const parsedUrl = parseUrl(url);
    if (!parsedUrl.valid) {
      return res.status(400).send("Invalid URL");
    }

    // Select user agent
    let userAgent = "Prach-Browse/1.0";
    if (req.app.locals.customUserAgent) {
      userAgent = req.app.locals.customUserAgent;
    } else if (req.app.locals.userAgentRotation) {
      userAgent = getRandomUserAgent(req.app.locals.userAgents);
    }

    // Fetch the image
    const response = await axios({
      method: "GET",
      url: parsedUrl.normalizedUrl,
      responseType: "arraybuffer",
      headers: {
        "User-Agent": userAgent,
        "Accept": "image/*",
        "Referer": "https://www.google.com/",
      },
      timeout: 10000,
      maxRedirects: 5,
    });

    // Set appropriate headers
    const contentType = response.headers["content-type"] || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours

    // Send the image
    res.send(response.data);
  } catch (error) {
    console.error("Image proxy error:", error.message);
    res.status(500).send("Error fetching image");
  }
};

/**
 * Handle media proxy requests (video, audio)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleMediaProxy = async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).send("Missing URL parameter");
    }

    // Parse and normalize URL
    const parsedUrl = parseUrl(url);
    if (!parsedUrl.valid) {
      return res.status(400).send("Invalid URL");
    }

    // Select user agent
    let userAgent = "Prach-Browse/1.0";
    if (req.app.locals.customUserAgent) {
      userAgent = req.app.locals.customUserAgent;
    } else if (req.app.locals.userAgentRotation) {
      userAgent = getRandomUserAgent(req.app.locals.userAgents);
    }

    // Forward the request to the target URL
    const response = await axios({
      method: "GET",
      url: parsedUrl.normalizedUrl,
      responseType: "stream",
      headers: {
        "User-Agent": userAgent,
        "Accept": "*/*",
        "Referer": "https://www.google.com/",
      },
      timeout: 30000,
      maxRedirects: 5,
    });

    // Copy headers from original response
    for (const [key, value] of Object.entries(response.headers)) {
      // Skip certain headers
      if (!["connection", "transfer-encoding"].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    // Pipe the media stream
    response.data.pipe(res);
  } catch (error) {
    console.error("Media proxy error:", error.message);
    res.status(500).send("Error fetching media");
  }
};

/**
 * Handle generic resource proxy requests (CSS, fonts, etc.)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleResourceProxy = async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).send("Missing URL parameter");
    }

    // Parse and normalize URL
    const parsedUrl = parseUrl(url);
    if (!parsedUrl.valid) {
      return res.status(400).send("Invalid URL");
    }

    // Select user agent
    let userAgent = "Prach-Browse/1.0";
    if (req.app.locals.customUserAgent) {
      userAgent = req.app.locals.customUserAgent;
    } else if (req.app.locals.userAgentRotation) {
      userAgent = getRandomUserAgent(req.app.locals.userAgents);
    }

    // Fetch the resource
    const response = await axios({
      method: "GET",
      url: parsedUrl.normalizedUrl,
      responseType: "arraybuffer",
      headers: {
        "User-Agent": userAgent,
        "Accept": "*/*",
        "Referer": "https://www.google.com/",
      },
      timeout: 10000,
      maxRedirects: 5,
    });

    // Set appropriate headers
    const contentType = response.headers["content-type"] || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours

    // Send the resource
    res.send(response.data);
  } catch (error) {
    console.error("Resource proxy error:", error.message);
    res.status(500).send("Error fetching resource");
  }
};

module.exports = {
  handleImageProxy,
  handleMediaProxy,
  handleResourceProxy,
};