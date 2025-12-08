
export const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error); 
};

export const errorHandler = (err, req, res, next) => {
  console.error(" SERVER ERROR:", err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(err.statusCode || statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    statusCode: err.statusCode || statusCode,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
