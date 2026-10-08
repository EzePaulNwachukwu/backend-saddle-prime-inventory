const AppError = require('../utils/appError');

// Mongoose "invalid ObjectId" error -> a clean 400 instead of a raw 500
const handleCastError = (err) => new AppError(`Invalid ${err.path}: ${err.value}`, 400);

// Duplicate unique-index error (e.g. username already exists)
const handleDuplicateFields = (err) => {
  const value = Object.values(err.keyValue)[0];
  return new AppError(`Duplicate value: "${value}". Please use another value`, 400);
};

// Mongoose schema validation error -> combine all field messages into one
const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((el) => el.message);
  return new AppError(`Invalid input data: ${messages.join('. ')}`, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired. Please log in again', 401);

// Central error-handling middleware (must be registered last, with 4 args)
module.exports = (err, req, res, next) => {
  let error = err;
  error.statusCode = error.statusCode || 500;

  if (error.name === 'CastError') error = handleCastError(error);
  if (error.code === 11000) error = handleDuplicateFields(error);
  if (error.name === 'ValidationError') error = handleValidationError(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  res.status(error.statusCode || 500).json({
    message: error.message || 'Something went wrong',
  });
};
