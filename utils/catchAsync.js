// Wraps an async controller function so any rejected promise/thrown error
// is forwarded to next(), instead of needing a try/catch in every controller.
module.exports = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};
