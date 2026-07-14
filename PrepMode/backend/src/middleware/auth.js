const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { env } = require('../config/env');
const { unauthorized, forbidden } = require('../utils/httpError');

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

async function resolveUser(req) {
  const token = extractToken(req);
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
  const user = await User.findById(payload.sub);
  if (!user || user.status !== 'active') return null;
  return user;
}

/** Require a valid authenticated user. Deny by default. */
function requireAuth(roles) {
  return async (req, _res, next) => {
    try {
      const user = await resolveUser(req);
      if (!user) throw unauthorized();
      if (roles && roles.length && !roles.includes(user.role)) {
        throw forbidden();
      }
      req.user = user;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Attach the user if a valid token is present; never fail. */
async function optionalAuth(req, _res, next) {
  try {
    req.user = await resolveUser(req);
  } catch {
    req.user = null;
  }
  next();
}

const requireLearner = requireAuth(['registered_learner']);
const requireAdmin = requireAuth(['admin']);
const requireAnyUser = requireAuth();

module.exports = { requireAuth, optionalAuth, requireLearner, requireAdmin, requireAnyUser };
