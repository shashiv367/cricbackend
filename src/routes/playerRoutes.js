const express = require('express');
const playerController = require('../controllers/playerController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, playerController.listPlayers);
router.get('/:playerId', verifyToken, playerController.getPlayer);
router.get('/:playerId/stats', verifyToken, playerController.getPlayerStats);
router.put('/:playerId/profile', verifyToken, playerController.updatePlayerProfile);

module.exports = router;







