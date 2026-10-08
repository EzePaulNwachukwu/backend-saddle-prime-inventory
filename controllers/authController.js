const jwt = require('jsonwebtoken');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const logActivity = require('../utils/logActivity');

// Generates a signed JWT for a given user id
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });

exports.register = catchAsync(async (req, res, next) => {
  const { username, password, role } = req.body;

  const userExists = await User.findOne({ username });
  if (userExists) {
    return next(new AppError('Username already exists', 400));
  }

  const user = await User.create({ username, password, role });

  await logActivity(req.user._id, 'REGISTER_USER', `Registered new user "${user.username}" with role "${user.role}"`);

  res.status(201).json({
    _id: user._id,
    username: user.username,
    role: user.role,
    token: generateToken(user._id),
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  // password has select: false on the schema, so it must be explicitly requested here
  const user = await User.findOne({ username }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError('Invalid username or password', 401));
  }

  res.status(200).json({
    _id: user._id,
    username: user.username,
    role: user.role,
    token: generateToken(user._id),
  });
});
