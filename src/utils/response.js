class ApiResponse {
  static success(message = 'Success', data = null) {
    return {
      success: true,
      message,
      data
    };
  }

  static created(message = 'Created successfully', data = null) {
    return {
      success: true,
      message,
      data
    };
  }

  static paginated(message = 'Success', data = [], meta = {}) {
    return {
      success: true,
      message,
      data,
      meta: {
        ...meta,
        hasNextPage: meta.page < meta.totalPages,
        hasPrevPage: meta.page > 1
      }
    };
  }

  static error(message = 'Something went wrong', errors = null) {
    const response = {
      success: false,
      message
    };
    if (errors) {
      response.errors = errors;
    }
    return response;
  }

  static unauthorized(res, message = 'Unauthorized') {
    return res.status(401).json({
      success: false,
      message
    });
  }

  static forbidden(res, message = 'Forbidden') {
    return res.status(403).json({
      success: false,
      message
    });
  }

  static notFound(res, message = 'Not found') {
    return res.status(404).json({
      success: false,
      message
    });
  }

  static badRequest(res, message = 'Bad request', errors = null) {
    const response = {
      success: false,
      message
    };
    if (errors) {
      response.errors = errors;
    }
    return res.status(400).json(response);
  }
}

module.exports = ApiResponse;
