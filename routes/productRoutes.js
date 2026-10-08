const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getInventoryValue,
} = require('../controllers/productController');

const router = express.Router();

// All product routes require a logged-in user
router.use(protect);

// Must be declared before /:id, or "reports" would be treated as an id
router.get('/reports/low-stock', getLowStockProducts);
router.get('/reports/inventory-value', getInventoryValue);

router.route('/').get(getAllProducts).post(createProduct);

// Deleting a product is destructive, so only an admin can do it
router.route('/:id').get(getProduct).put(updateProduct).delete(restrictTo('admin'), deleteProduct);

module.exports = router;
