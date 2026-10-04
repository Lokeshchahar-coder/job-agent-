export function successResponse(res, message, data = null, statusCode = 200) {
  const response = {
    success: true,
    message
  };
  if (data !== null) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
}

export function errorResponse(res, message, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message
  });
}