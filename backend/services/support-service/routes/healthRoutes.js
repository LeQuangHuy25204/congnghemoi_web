const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'support-service', time: new Date().toISOString() });
});

module.exports = router;
