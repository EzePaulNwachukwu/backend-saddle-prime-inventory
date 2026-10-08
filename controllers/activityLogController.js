const ActivityLog = require('../models/ActivityLog');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');

// Supports the same date filtering as sales, e.g.
// GET /api/activity-logs?createdAt[gte]=2026-09-01&createdAt[lte]=2026-09-03
exports.getAllActivityLogs = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(ActivityLog.find().populate('user', 'username role'), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const [logs, totalCount] = await Promise.all([features.query, features.count()]);

  res.status(200).json({
    data: logs,
    pagination: features.getPaginationMeta(totalCount),
  });
});
