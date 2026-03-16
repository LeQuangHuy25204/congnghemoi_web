const crypto = require('crypto');

const generateRequestId = () => crypto.randomBytes(8).toString('hex');

module.exports = {
  generateRequestId,
};
