const express = require('express');
const matchController = require('../controllers/matchController');

const router = express.Router();

router.get('/', matchController.listMatches);
router.post('/', matchController.createMatch);

module.exports = router;








