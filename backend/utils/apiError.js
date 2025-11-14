

class ApiError extends Error {
  constructor(statusCode, message, stack = "") {
    super(message);

    this.statusCode = statusCode;
    this.success = false;
    this.message = message;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
