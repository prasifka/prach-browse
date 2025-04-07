const NodeCache = require("node-cache");

/**
 * Create and configure cache instance
 * @param {number} ttl - Time to live in seconds
 * @returns {Object} - Configured cache instance
 */
const createCache = (ttl = 3600) => {
  return new NodeCache({
    stdTTL: ttl,
    checkperiod: 120,
    useClones: false,
  });
};

/**
 * Get item from cache
 * @param {Object} cache - Cache instance
 * @param {string} key - Cache key
 * @returns {any} - Cached item or undefined if not found
 */
const getCachedItem = (cache, key) => {
  if (!cache) {
    return undefined;
  }
  return cache.get(key);
};

/**
 * Set item in cache
 * @param {Object} cache - Cache instance
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Optional custom TTL for this item
 * @returns {boolean} - Success status
 */
const setCachedItem = (cache, key, value, ttl = undefined) => {
  if (!cache) {
    return false;
  }
  return cache.set(key, value, ttl);
};

/**
 * Delete item from cache
 * @param {Object} cache - Cache instance
 * @param {string} key - Cache key
 * @returns {number} - Number of deleted entries
 */
const deleteCachedItem = (cache, key) => {
  if (!cache) {
    return 0;
  }
  return cache.del(key);
};

/**
 * Clear entire cache
 * @param {Object} cache - Cache instance
 * @returns {void}
 */
const clearCache = (cache) => {
  if (!cache) {
    return;
  }
  cache.flushAll();
};

/**
 * Get cache statistics
 * @param {Object} cache - Cache instance
 * @returns {Object} - Cache statistics
 */
const getCacheStats = (cache) => {
  if (!cache) {
    return { keys: 0, hits: 0, misses: 0, ksize: 0, vsize: 0 };
  }
  return cache.getStats();
};

module.exports = {
  createCache,
  getCachedItem,
  setCachedItem,
  deleteCachedItem,
  clearCache,
  getCacheStats,
};
