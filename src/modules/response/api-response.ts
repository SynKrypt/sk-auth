export default class ApiResponse {
  public static success(status_code: number, message: string, data: any) {
    return {
      success: true,
      status_code: status_code,
      message,
      data,
    };
  }

  public static failure(
    error_type: ErrorType,
    status_code: number,
    message: string,
    errors?: any
  ) {
    return {
      success: false,
      error_type: error_type,
      status_code: status_code,
      message,
      errors,
    };
  }
}

export enum ErrorType {
  validation_error = "validation_error",
  unknown_error = "unknown_error",
  already_exists = "already_exists",
  database_error = "database_error",
  not_found = "not_found",
  unauthorized = "unauthorized",
  forbidden = "forbidden",
  invalid_token = "invalid_token",
  token_expired = "token_expired",
  internal_server_error = "internal_server_error",
}

export class CustomError extends Error {
  error_type: ErrorType;
  status_code: number;
  errors?: any;

  constructor(
    error_type: ErrorType,
    status_code: number,
    message: string,
    errors?: any
  ) {
    super(message);
    this.error_type = error_type;
    this.status_code = status_code;

    if (!errors) {
      this.errors = [];
    } else if (typeof errors === "object") {
      this.errors = [errors];
    } else if (typeof errors === "string") {
      this.errors = [
        {
          error: errors.toLowerCase(),
        },
      ];
    } else if (Array.isArray(errors)) {
      this.errors = errors;
    }
  }
}
