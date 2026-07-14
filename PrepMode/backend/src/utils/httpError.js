class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code || 'ERROR';
  }
}

const badRequest = (message, code = 'BAD_REQUEST') => new HttpError(400, message, code);
const unauthorized = (message = 'Authentication required', code = 'UNAUTHORIZED') => new HttpError(401, message, code);
const forbidden = (message = 'You do not have access to this resource', code = 'FORBIDDEN') => new HttpError(403, message, code);
const notFound = (message = 'Resource not found', code = 'NOT_FOUND') => new HttpError(404, message, code);
const conflict = (message, code = 'CONFLICT') => new HttpError(409, message, code);

module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound, conflict };
