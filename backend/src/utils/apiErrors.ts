interface ApiErrors {
  badRequest: (message: string) => Response;
  unauthorized: (message: string) => Response;
  noContent: (message: string) => Response;
  forbidden: (message: string) => Response;
  notFaund: (message: string) => Response;
  conflict: (message: string) => Response;
}
interface Response {
  message: string;
  status: number;
}

export const apiErrors: ApiErrors = {
  badRequest(message) {
    return {
      message,
      status: 400,
    };
  },

  unauthorized(message) {
    return {
      message,
      status: 401,
    };
  },

  noContent(message) {
    return {
      message,
      status: 402,
    };
  },

  forbidden(message) {
    return {
      message,
      status: 403,
    };
  },

  notFaund(message) {
    return {
      message,
      status: 404,
    };
  },

  conflict(message) {
    return {
      message,
      status: 409,
    };
  },
};
