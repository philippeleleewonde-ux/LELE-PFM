/**
 * Error handling utilities
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'You do not have permission') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = 'Request timeout') {
    super(message, 'TIMEOUT', 0);
    this.name = 'TimeoutError';
  }
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
};

export const getErrorCode = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.code;
  }

  return 'UNKNOWN_ERROR';
};

export const handleError = (error: unknown, context?: string): void => {
  const message = getErrorMessage(error);
  const code = getErrorCode(error);

  console.error(
    `[${code}${context ? ` - ${context}` : ''}] ${message}`,
    error
  );
};
