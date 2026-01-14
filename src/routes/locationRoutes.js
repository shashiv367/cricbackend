const express = require('express');
const locationController = require('../controllers/locationController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, locationController.listLocations);
router.post('/', verifyToken, locationController.createOrGetLocation);

module.exports = router;







