import asyncHandler from "@/utils/async-handler.ts";
import { Request, Response } from "express";
import { CustomError, ErrorType } from "../api-response/api-response.ts";
import ApiResponse from "../api-response/api-response.ts";

export const registerWeb = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new CustomError(
      ErrorType.validation_error,
      400,
      "email and password are required"
    );
  }
  res
    .status(200)
    .json(ApiResponse.success(200, "user registered successfully", {}));
});
