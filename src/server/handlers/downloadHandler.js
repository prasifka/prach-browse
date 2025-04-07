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

    // Generate a unique filename
    const originalFilename = path
      .basename(parsedUrl.normalizedUrl)
      .split("?")[0];
    const fileExtension = path.extname(originalFilename) || "";
    const fileBasename = path.basename(originalFilename, fileExtension);
    const uniqueFilename = `${fileBasename}-${uuidv4().substring(
      0,
      8
    )}${fileExtension}`;
    const downloadPath = path.join(req.app.locals.downloadDir, uniqueFilename);

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
    });

    // Get content type and size
    const contentType =
      response.headers["content-type"] || "application/octet-stream";
    const contentLength = response.headers["content-length"] || 0;

    // Create write stream to save file
    const writer = fs.createWriteStream(downloadPath);

    // Pipe the response data to the file
    response.data.pipe(writer);

    // Handle completion
    writer.on("finish", () => {
      console.log(`File downloaded: ${downloadPath}`);

      // Set headers for download
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${originalFilename}"`
      );
      res.setHeader("Content-Type", contentType);

      // Send the file
      res.download(downloadPath, originalFilename, (err) => {
        if (err) {
          console.error("Download error:", err);
        }

        // Delete the file after download
        fs.unlink(downloadPath, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Error deleting file:", unlinkErr);
          }
        });
      });
    });

    // Handle errors
    writer.on("error", (err) => {
      console.error("File write error:", err);
      res.render("index", {
        title: "Prach Browse",
        url: "",
        content: null,
        error: `Error downloading file: ${err.message}`,
      });
    });
  } catch (error) {
    console.error("Download error:", error.message);
    res.render("index", {
      title: "Prach Browse",
      url: "",
      content: null,
      error: `Error downloading file: ${error.message}`,
    });
  }
};

module.exports = {
  handleDownloadRequest,
};
