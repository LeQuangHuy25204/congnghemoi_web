const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal server error',
    requestId: req.requestId,
  });
};

module.exports = errorHandler;
