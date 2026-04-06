const express = require('express');
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes (Guests can see matches and scores)
router.get('/matches', userController.listMatches);
router.get('/matches/:matchId/scoreboard', userController.getMatchScoreboard);

// Protected routes (Future: user profiles, settings, etc.)
router.use(verifyToken);

router.get('/me/matches', userController.listMyMatches);
router.get('/me/cricket-stats', userController.getMyCricketStats);
router.get('/me/teams', userController.listMyRelatedTeams);
router.get('/tournaments', userController.listTournaments);
router.post('/tournaments', userController.createTournament);

module.exports = router;


