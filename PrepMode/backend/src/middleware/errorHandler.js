const { env } = require('../config/env');

function notFoundHandler(_req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  // Mongo duplicate key -> 409 Conflict with a stable code
  if (err && (err.code === 11000 || err.code === 11001)) {
    const field = Object.keys(err.keyPattern || { resource: 1 })[0];
    return res.status(409).json({
      error: { code: 'DUPLICATE', message: `Duplicate value for ${field}`, field },
    });
  }

  if (err && err.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: details[0] || 'Validation failed', details },
    });
  }

  if (err && err.name === 'CastError') {
    return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid identifier format' } });
  }

  const status = err && err.status ? err.status : 500;
  const code = err && err.code && typeof err.code === 'string' ? err.code : 'INTERNAL_ERROR';
  const message = status < 500 ? err.message : 'Something went wrong';

  if (status >= 500 && env.nodeEnv !== 'test') {
    // eslint-disable-next-line no-console
    console.error('[prepmode]', err);
  }

  res.status(status).json({ error: { code, message } });
}

module.exports = { notFoundHandler, errorHandler };
