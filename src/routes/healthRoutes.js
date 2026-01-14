const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'cricapp-backend',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;








