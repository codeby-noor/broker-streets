/**
 * Escapes special regex characters in a user-supplied string to prevent ReDoS attacks.
 * @param {string} str - User input string
 * @returns {string} Escaped string safe for RegExp construction
 */
const escapeRegex = (str) => (str ? String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '');

module.exports = escapeRegex;
