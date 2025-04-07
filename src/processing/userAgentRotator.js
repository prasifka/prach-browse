/**
 * Get a random user agent from the provided list
 * @param {Array} userAgents - List of user agents
 * @returns {string} - Random user agent
 */
const getRandomUserAgent = (userAgents) => {
  if (!userAgents || userAgents.length === 0) {
    return "Prach-Browse/1.0";
  }

  const randomIndex = Math.floor(Math.random() * userAgents.length);
  return userAgents[randomIndex];
};

module.exports = {
  getRandomUserAgent,
};
