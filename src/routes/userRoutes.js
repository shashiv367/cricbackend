const express = require('express');
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken);

router.get('/matches', userController.listMatches);
router.get('/matches/:matchId/scoreboard', userController.getMatchScoreboard);

module.exports = router;







