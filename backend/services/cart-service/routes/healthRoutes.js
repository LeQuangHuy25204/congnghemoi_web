const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'cart-service', time: new Date().toISOString() });
});

module.exports = router;
