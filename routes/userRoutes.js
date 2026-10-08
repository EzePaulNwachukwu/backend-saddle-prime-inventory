const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { getAllUsers, getUser, updateUser, deleteUser } = require('../controllers/userController');

const router = express.Router();

// All user routes require a logged-in admin
router.use(protect);
router.use(restrictTo('admin'));

router.route('/').get(getAllUsers);

router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;
