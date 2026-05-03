const logger = require('../../utils/logger');

function errorMiddleware(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) logger.error({ err, url: req.url }, 'Unhandled error');

  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = errorMiddleware;
