const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { recordSale, getAllSales, getSale, getTodaysSales, getSalesSummary } = require('../controllers/saleController');

const router = express.Router();

router.use(protect);

// Any logged-in staff member can record a sale
router.post('/', recordSale);

// Only admins browse the sales history/activity
router.get('/reports/today', restrictTo('admin'), getTodaysSales);
router.get('/reports/summary', restrictTo('admin'), getSalesSummary);
router.get('/', restrictTo('admin'), getAllSales);
router.get('/:id', restrictTo('admin'), getSale);

module.exports = router;
