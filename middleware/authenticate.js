/**
 * Middleware to bypass authentication (no JWT verification).
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
function authenticate(req, res, next) {
  // Simply pass the request to the next middleware or route handler
  next();
}

module.exports = authenticate;