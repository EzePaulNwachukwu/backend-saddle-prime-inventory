const User = require('../models/User');
const factory = require('./handlerFactory');

// User creation happens through auth/register (it needs password hashing + a token),
// so only read/update/delete are exposed here.
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User, 'UPDATE_USER');
exports.deleteUser = factory.deleteOne(User, 'DELETE_USER');
