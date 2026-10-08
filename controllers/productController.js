const Product = require('../models/Product');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const logActivity = require('../utils/logActivity');

// Standard CRUD reused from the factory
exports.getAllProducts = factory.getAll(Product);
exports.getProduct = factory.getOne(Product);
exports.updateProduct = factory.updateOne(Product, 'UPDATE_PRODUCT');
exports.deleteProduct = factory.deleteOne(Product, 'DELETE_PRODUCT');

// Custom create: addedBy must come from the logged-in user, not the request body
exports.createProduct = catchAsync(async (req, res, next) => {
  const { name, category, quantity, price, supplier } = req.body;

  const product = await Product.create({
    name,
    category,
    quantity,
    price,
    supplier,
    addedBy: req.user._id,
  });

  await logActivity(req.user._id, 'CREATE_PRODUCT', `Created product "${product.name}"`);

  res.status(201).json(product);
});

// Custom report: not a simple find, so it lives outside the factory
exports.getLowStockProducts = catchAsync(async (req, res, next) => {
  const lowStockProducts = await Product.aggregate([
    { $match: { quantity: { $lt: 10 } } },
    { $sort: { quantity: 1 } },
  ]);

  res.status(200).json(lowStockProducts);
});

// Total worth of everything currently in stock (quantity * price, summed across all products)
exports.getInventoryValue = catchAsync(async (req, res, next) => {
  const result = await Product.aggregate([
    {
      $group: {
        _id: null,
        totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
        totalUnits: { $sum: '$quantity' },
        totalProductTypes: { $sum: 1 },
      },
    },
  ]);

  const summary = result[0]
    ? { totalValue: result[0].totalValue, totalUnits: result[0].totalUnits, totalProductTypes: result[0].totalProductTypes }
    : { totalValue: 0, totalUnits: 0, totalProductTypes: 0 };

  res.status(200).json(summary);
});
