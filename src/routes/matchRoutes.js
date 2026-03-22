const express = require('express');
const matchController = require('../controllers/matchController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', matchController.listMatches);
// Protect match creation so teams/matches can't be created without a valid Supabase token.
router.post('/', verifyToken, matchController.createMatch);

module.exports = router;










