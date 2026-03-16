const express = require('express');
const umpireController = require('../controllers/umpireController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require umpire role
router.use(verifyToken);
router.use(requireRole('umpire', 'user'));

router.get('/community', umpireController.listUmpires);
router.post('/matches', umpireController.createMatch);
router.get('/matches', umpireController.listUmpireMatches);
router.get('/matches/:matchId', umpireController.getMatchDetails);
router.put('/matches/:matchId/score', umpireController.updateMatchScore);
router.put('/matches/:matchId/status', umpireController.updateMatchStatus);
router.put('/matches/:matchId/config', umpireController.updateMatchConfig);
router.put('/matches/:matchId/toss', umpireController.updateMatchToss);
router.post('/matches/:matchId/commentary', umpireController.addCommentary);
router.post('/matches/:matchId/players', umpireController.addPlayerToMatch);
router.delete('/matches/:matchId/players/:playerStatId', umpireController.deletePlayerFromMatch);
router.put('/matches/:matchId/player-stats/:playerStatId', umpireController.updatePlayerStats);

module.exports = router;




