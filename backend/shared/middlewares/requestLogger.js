const { generateRequestId } = require('../utils/requestId');

const requestLogger = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || generateRequestId();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    // eslint-disable-next-line no-console
    console.log(`[${req.method}] ${req.originalUrl} ${res.statusCode} - ${durationMs}ms - ${requestId}`);
  });

  next();
};

module.exports = requestLogger;
