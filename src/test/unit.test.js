const { parseUrl, resolveUrl } = require("../processing/urlProcessor");
const { getRandomUserAgent } = require("../processing/userAgentRotator");
const { applyContentFilter } = require("../processing/contentFilter");
const {
  createCache,
  getCachedItem,
  setCachedItem,
} = require("../processing/cacheManager");
const { loadConfig } = require("../config/configManager");
const cheerio = require("cheerio");

// Mock process.env and process.argv for testing
process.env.PORT = "3000";
process.env.CACHE_ENABLED = "true";
process.argv = ["node", "index.js"];

describe("URL Processor", () => {
  test("parseUrl should handle valid URLs", () => {
    const result = parseUrl("https://example.com");
    expect(result.valid).toBe(true);
    expect(result.normalizedUrl).toBe("https://example.com/");
  });

  test("parseUrl should add protocol if missing", () => {
    const result = parseUrl("example.com");
    expect(result.valid).toBe(true);
    expect(result.normalizedUrl).toBe("http://example.com/");
  });

  test("parseUrl should detect search queries", () => {
    const result = parseUrl("what is privacy");
    expect(result.valid).toBe(true);
    expect(result.isSearchQuery).toBe(true);
  });

  test("resolveUrl should convert relative URLs to absolute", () => {
    const result = resolveUrl("/page.html", "https://example.com");
    expect(result).toBe("https://example.com/page.html");
  });
});

describe("User Agent Rotator", () => {
  test("getRandomUserAgent should return a user agent from the list", () => {
    const userAgents = ["Agent 1", "Agent 2", "Agent 3"];
    const result = getRandomUserAgent(userAgents);
    expect(userAgents).toContain(result);
  });

  test("getRandomUserAgent should handle empty list", () => {
    const result = getRandomUserAgent([]);
    expect(result).toBe("Prach-Browse/1.0");
  });
});

describe("Content Filter", () => {
  test("applyContentFilter should remove ads with low level", () => {
    const html =
      '<div class="ad-banner">Ad</div><div class="content">Content</div>';
    const $ = cheerio.load(html);
    applyContentFilter($, "low");
    expect($.html()).not.toContain("ad-banner");
    expect($.html()).toContain("content");
  });

  test("applyContentFilter should do nothing with none level", () => {
    const html =
      '<div class="ad-banner">Ad</div><div class="content">Content</div>';
    const $ = cheerio.load(html);
    applyContentFilter($, "none");
    expect($.html()).toContain("ad-banner");
    expect($.html()).toContain("content");
  });
});

describe("Cache Manager", () => {
  test("createCache should return a cache instance", () => {
    const cache = createCache();
    expect(cache).toBeDefined();
  });

  test("setCachedItem and getCachedItem should work", () => {
    const cache = createCache();
    setCachedItem(cache, "key", "value");
    const result = getCachedItem(cache, "key");
    expect(result).toBe("value");
  });
});

describe("Config Manager", () => {
  test("loadConfig should load default configuration", () => {
    const config = loadConfig();
    expect(config.port).toBe("3000");
    expect(config.cacheEnabled).toBe(true);
  });
});

test("loadConfig should enable caching when flag provided without value", () => {
  process.env.CACHE_ENABLED = "false";
  process.argv = ["node", "index.js", "--cache-enabled"];
  const config = loadConfig();
  expect(config.cacheEnabled).toBe(true);
  process.argv = ["node", "index.js"];
  process.env.CACHE_ENABLED = "true";
});
