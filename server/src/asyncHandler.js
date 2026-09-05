// Express 4 doesn't catch errors thrown inside an async route handler — they become
// unhandled promise rejections and can crash the whole process. Wrap handlers with this
// so any thrown/rejected error is forwarded to Express's error-handling middleware instead.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
