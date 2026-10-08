const Product = require('../models/Product');
const Sale = require('../models/Sale');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const logActivity = require('../utils/logActivity');

// Records a sale, snapshots the product's current name/price, and decreases its stock
exports.recordSale = catchAsync(async (req, res, next) => {
  const { productId, quantitySold } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  if (quantitySold > product.quantity) {
    return next(new AppError(`Only ${product.quantity} unit(s) of "${product.name}" left in stock`, 400));
  }

  const sale = await Sale.create({
    product: product._id,
    productName: product.name,
    quantitySold,
    unitPrice: product.price,
    totalAmount: product.price * quantitySold,
    soldBy: req.user._id,
  });

  product.quantity -= quantitySold;
  await product.save();

  await logActivity(req.user._id, 'RECORD_SALE', `Sold ${quantitySold} x "${product.name}"`);

  res.status(201).json(sale);
});

// Supports date filtering via the standard apiFeatures query syntax, e.g.
// GET /api/sales?createdAt[gte]=2026-09-01&createdAt[lte]=2026-09-03
exports.getAllSales = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Sale.find().populate('soldBy', 'username role'), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const [sales, totalCount] = await Promise.all([features.query, features.count()]);

  res.status(200).json({
    data: sales,
    pagination: features.getPaginationMeta(totalCount),
  });
});

exports.getSale = catchAsync(async (req, res, next) => {
  const sale = await Sale.findById(req.params.id).populate('soldBy', 'username role');

  if (!sale) {
    return next(new AppError('Sale not found', 404));
  }

  res.status(200).json(sale);
});

// Convenience endpoint so the frontend doesn't have to compute today's date range itself
exports.getTodaysSales = catchAsync(async (req, res, next) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const sales = await Sale.find({ createdAt: { $gte: startOfDay, $lte: endOfDay } })
    .populate('soldBy', 'username role')
    .sort('-createdAt');

  res.status(200).json(sales);
});

// Aggregated totals for a date range — powers the dashboard's date-filterable revenue card.
// Same createdAt[gte]/[lte] convention as the other endpoints; defaults to today when omitted.
exports.getSalesSummary = catchAsync(async (req, res, next) => {
  let startDate;
  let endDate;

  const range = req.query.createdAt;

  if (range && (range.gte || range.lte)) {
    startDate = range.gte ? new Date(range.gte) : new Date(0);
    endDate = range.lte ? new Date(range.lte) : new Date();
  } else {
    startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
  }

  const result = await Sale.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalSalesCount: { $sum: 1 },
        totalUnitsSold: { $sum: '$quantitySold' },
      },
    },
  ]);

  const summary = result[0]
    ? { totalRevenue: result[0].totalRevenue, totalSalesCount: result[0].totalSalesCount, totalUnitsSold: result[0].totalUnitsSold }
    : { totalRevenue: 0, totalSalesCount: 0, totalUnitsSold: 0 };

  res.status(200).json({ ...summary, startDate, endDate });
});
