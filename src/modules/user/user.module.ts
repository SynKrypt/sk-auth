import { Request, Response } from "express";
import { UserService } from "./user.service.ts";
import asyncHandler from "@/utils/async-handler.ts";
import ApiResponse, {
  CustomError,
  ErrorType,
} from "../response/api-response.ts";
import { email_schema, password_schema } from "./user.validation.ts";
import { PostgresService } from "../db/db.service.ts";

export type ICookieType = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  maxAge: number;
};
const cookieOptions: ICookieType = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  maxAge: 60 * 60 * 24,
};

export interface IUserModule {
  registerWeb(req: Request, res: Response): Promise<any>;
}

class UserModule implements IUserModule {
  private userService: UserService;
  private dbService: PostgresService;

  constructor() {
    this.userService = new UserService();
    this.dbService = new PostgresService();
  }

  public registerWeb = asyncHandler(async (req: Request, res: Response) => {
    if (!req.body) {
      throw new CustomError(ErrorType.not_found, 400, "request body missing");
    }
    const { email, password } = req.body;

    // Validations
    if (!email || !password) {
      throw new CustomError(
        ErrorType.not_found,
        400,
        "email and password are required"
      );
    }
    const validationErrors = [];
    // Email validation
    const emailValidationResult = email_schema.safeParse(email);
    // Password validation
    const passwordValidationResult = password_schema.safeParse(password);
    for (const validationResult of [
      emailValidationResult,
      passwordValidationResult,
    ]) {
      if (!validationResult.success) {
        validationErrors.push(validationResult.error);
      }
    }
    if (validationErrors.length > 0) {
      throw new CustomError(
        ErrorType.validation_error,
        400,
        "validation error",
        validationErrors
      );
    }

    // Check if user already exists
    const userFromDB = await this.userService.findUserByEmail(email);
    if (userFromDB.success) {
      throw new CustomError(
        ErrorType.database_error,
        409,
        "user with this email already exists"
      );
    }

    // Create new user account
    const createdUser = await this.userService.createNewAdmin(email, password);
    if (!createdUser.success) {
      throw new CustomError(
        ErrorType.database_error,
        503,
        "admin creation failed",
        createdUser.errors
      );
    }

    // Set cookie and send response
    res
      .cookie("access_token", createdUser.data.token, cookieOptions)
      .status(201)
      .json(
        ApiResponse.success(201, "admin created successfully", createdUser.data)
      );
  });
}

export default new UserModule();
