const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { getAllActivityLogs } = require('../controllers/activityLogController');

const router = express.Router();

// Admin-only: this is the "everything going on in the store" audit trail
router.use(protect);
router.use(restrictTo('admin'));

router.get('/', getAllActivityLogs);

module.exports = router;
