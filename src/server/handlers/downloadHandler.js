const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { parseUrl } = require("../../processing/urlProcessor");
const { getRandomUserAgent } = require("../../processing/userAgentRotator");

/**
 * Handle file download requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleDownloadRequest = async (req, res) => {
  try {
    // Get URL from query
    const url = req.query.url || "";

    // If no URL provided, redirect to home
    if (!url) {
      return res.redirect("/");
    }

    // Parse and normalize URL
    const parsedUrl = parseUrl(url);
    if (!parsedUrl.valid) {
      return res.render("index", {
        title: "Prach Browse",
        url: "",
        content: null,
        error: "Invalid URL for download. Please enter a valid URL.",
      });
    }

    // Select user agent
    let userAgent = "Prach-Browse/1.0";
    if (req.app.locals.customUserAgent) {
      userAgent = req.app.locals.customUserAgent;
    } else if (req.app.locals.userAgentRotation) {
      userAgent = getRandomUserAgent(req.app.locals.userAgents);
    }

    // Ensure download directory exists
    const downloadDir =
      req.app.locals.downloadDir || path.join(process.cwd(), "downloads");
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    console.log(`Starting download from ${parsedUrl.normalizedUrl}`);

    // Make request to download file
    const response = await axios({
      method: "GET",
      url: parsedUrl.normalizedUrl,
      responseType: "stream",
      headers: {
        "User-Agent": userAgent,
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        Referer: "https://www.google.com/",
        DNT: "1",
        Connection: "keep-alive",
      },
      timeout: 30000,
      maxRedirects: 5,
    });

    // Determine filename from headers or URL
    let originalFilename = path.basename(parsedUrl.normalizedUrl.split("?")[0]);

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers["content-disposition"] || "";
    const filenameMatch = contentDisposition.match(
      /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i
    );
    if (filenameMatch) {
      originalFilename = decodeURIComponent(
        filenameMatch[1] || filenameMatch[2]
      );
    }

    // Get content type and size
    const contentType =
      response.headers["content-type"] || "application/octet-stream";
    const contentLength = response.headers["content-length"] || 0;

    // Determine file extension
    const extensionMap = {
      "application/pdf": ".pdf",
      "application/zip": ".zip",
      "application/x-zip-compressed": ".zip",
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "video/mp4": ".mp4",
      "audio/mpeg": ".mp3",
    };

    let fileExtension = path.extname(originalFilename);
    const fileBasename = path.basename(originalFilename, fileExtension);

    if (!fileExtension && extensionMap[contentType]) {
      fileExtension = extensionMap[contentType];
      originalFilename = `${fileBasename}${fileExtension}`;
    }

    const uniqueFilename = `${fileBasename}-${uuidv4().substring(
      0,
      8
    )}${fileExtension}`;
    const downloadPath = path.join(downloadDir, uniqueFilename);

    console.log(`Content type: ${contentType}`);
    console.log(`Content length: ${contentLength} bytes`);
    console.log(`Saving to: ${downloadPath}`);

    // Create write stream to save file
    const writer = fs.createWriteStream(downloadPath);

    // Pipe the response data to the file
    response.data.pipe(writer);

    // Set up promise to wait for download to complete
    const downloadComplete = new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
      response.data.on("error", reject);
    });

    try {
      // Wait for download to complete
      await downloadComplete;
      console.log(`Download complete: ${downloadPath}`);

      // Set headers for download
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${originalFilename}"`
      );
      res.setHeader("Content-Type", contentType);

      // Send the file
      res.download(downloadPath, originalFilename, (err) => {
        if (err) {
          console.error("Error sending file:", err);
        }

        // Schedule file deletion for later (to ensure download completes)
        setTimeout(() => {
          fs.unlink(downloadPath, (unlinkErr) => {
            if (unlinkErr) {
              console.error("Error deleting file:", unlinkErr);
            } else {
              console.log(`Temporary file deleted: ${downloadPath}`);
            }
          });
        }, 60000); // Delete after 1 minute
      });
    } catch (error) {
      console.error("Download failed:", error);
      writer.end();

      // Delete the incomplete file
      try {
        fs.unlinkSync(downloadPath);
      } catch (unlinkErr) {
        console.error("Error deleting incomplete file:", unlinkErr);
      }

      throw error;
    }
  } catch (error) {
    console.error("Download error:", error.message);
    res.status(500).render("error", {
      title: "Download Error",
      message: `Error downloading file: ${error.message}`,
      error: { status: 500 },
    });
  }
};

module.exports = {
  handleDownloadRequest,
};
