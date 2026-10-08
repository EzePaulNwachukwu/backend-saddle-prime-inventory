// Generic CRUD handlers shared by every resource controller.
// Each function takes a Mongoose Model and returns an Express route handler,
// so productController/userController just plug their Model in instead of
// repeating the same find/create/update/delete + error handling each time.
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const logActivity = require('../utils/logActivity');

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Model.find(), req.query).filter().sort().limitFields().paginate();

    const [docs, totalCount] = await Promise.all([features.query, features.count()]);

    res.status(200).json({
      data: docs,
      pagination: features.getPaginationMeta(totalCount),
    });
  });

exports.getOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);

    if (!doc) {
      return next(new AppError(`${Model.modelName} not found`, 404));
    }

    res.status(200).json(doc);
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json(doc);
  });

// actionLabel is optional: when given (e.g. 'UPDATE_PRODUCT'), the change is recorded to the activity log
exports.updateOne = (Model, actionLabel) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError(`${Model.modelName} not found`, 404));
    }

    if (actionLabel) {
      const label = doc.name || doc.username || doc._id;
      await logActivity(req.user._id, actionLabel, `Updated ${Model.modelName.toLowerCase()} "${label}"`);
    }

    res.status(200).json(doc);
  });

exports.deleteOne = (Model, actionLabel) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`${Model.modelName} not found`, 404));
    }

    if (actionLabel) {
      const label = doc.name || doc.username || doc._id;
      await logActivity(req.user._id, actionLabel, `Deleted ${Model.modelName.toLowerCase()} "${label}"`);
    }

    res.status(200).json({ message: `${Model.modelName} removed` });
  });
