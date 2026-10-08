const ActivityLog = require('../models/ActivityLog');

// Records one audit trail entry. Swallows its own errors so a logging
// failure never breaks the actual action (product create/update/etc.) that triggered it.
const logActivity = async (userId, action, description) => {
  try {
    await ActivityLog.create({ user: userId, action, description });
  } catch (error) {
    console.error('Failed to record activity log:', error.message);
  }
};

module.exports = logActivity;
