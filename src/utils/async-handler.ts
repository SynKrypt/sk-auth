import { CustomError, ErrorType } from "../modules/response/api-response.ts";
import ApiResponse from "../modules/response/api-response.ts";

const asyncHandler = (
  fn: (req: any, res: any, next?: any) => Promise<void>
) => {
  return async (req: any, res: any, next?: any) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      if (error instanceof CustomError) {
        return res
          .status(error.status_code)
          .json(
            ApiResponse.failure(
              error.error_type,
              error.status_code,
              error.message,
              error.errors
            )
          );
      }
      return res
        .status(500)
        .json(
          ApiResponse.failure(
            ErrorType.unknown_error,
            500,
            "internal server error"
          )
        );
    }
  };
};

export default asyncHandler;
