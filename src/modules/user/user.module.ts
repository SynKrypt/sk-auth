import { Request, Response } from "express";
import { UserService } from "./user.service.ts";
import asyncHandler from "@/utils/async-handler.ts";
import ApiResponse, {
  CustomError,
  ErrorType,
} from "../response/api-response.ts";
import {
  email_schema,
  organizationId_schema,
  password_schema,
} from "./user.validation.ts";
import { PostgresService } from "../db/db.service.ts";

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
    const { email, password, organizationId } = req.body;

    // Validations
    if (!email || !password || !organizationId) {
      throw new CustomError(
        ErrorType.validation_error,
        400,
        "email, password and organizationId are required"
      );
    }
    const validationErrors = [];
    // Email validation
    const emailValidationResult = email_schema.safeParse(email);
    // Password validation
    const passwordValidationResult = password_schema.safeParse(password);
    // Organization-ID validation
    const organizationIdValidationResult =
      organizationId_schema.safeParse(organizationId);
    for (const validationResult of [
      emailValidationResult,
      passwordValidationResult,
      organizationIdValidationResult,
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

    // Check if organization exists
    const organizationFromDB =
      await this.dbService.getOrganizationById(organizationId);
    if (!organizationFromDB.success) {
      throw new CustomError(
        ErrorType.database_error,
        404,
        "organization not found"
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
    const createdUser = await this.userService.createNewUser(
      email,
      password,
      organizationId
    );
    if (!createdUser.success) {
      throw new CustomError(
        ErrorType.database_error,
        503,
        "user creation failed",
        createdUser.errors
      );
    }

    // Set cookie and send response
    res
      .cookie("access_token", createdUser.data.token)
      .status(201)
      .json(
        ApiResponse.success(201, "user created successfully", createdUser.data)
      );
  });
}

export default new UserModule();
