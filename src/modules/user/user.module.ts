import { Request, Response } from "express";
import { UserService } from "./user.service.ts";
import asyncHandler from "@/utils/async-handler.ts";
import ApiResponse, {
  CustomError,
  ErrorType,
} from "../response/api-response.ts";
import {
  loginSchema,
  email_schema,
  password_schema,
} from "./user.validation.ts";
import { PostgresService } from "../db/db.service.ts";
import envConfig from "@/config/env-config.ts";

export type ICookieType = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  maxAge: number;
};
const cookieOptions: ICookieType = {
  httpOnly: true,
  secure: envConfig.app.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 60 * 60 * 24 * 1000, // 1 day
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

  public loginWeb = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new CustomError(
        ErrorType.not_found,
        400,
        "email and password are required"
      );
    }
    // Validate request body
    const validationResult = loginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      throw new CustomError(
        ErrorType.validation_error,
        400,
        "invalid email or password",
        validationResult.error.errors
      );
    }

    // Find user by email
    const userResponse = await this.userService.findUserByEmail(email);
    if (!userResponse.success || !userResponse.data) {
      throw new CustomError(
        ErrorType.unauthorized,
        401,
        "user not found",
        userResponse.error
      );
    }

    const userLoginResponse = await this.userService.loginUser(
      email,
      password,
      userResponse.data
    );
    if (!userLoginResponse.success) {
      throw new CustomError(
        ErrorType.unauthorized,
        401,
        "login failed",
        userLoginResponse.error
      );
    }

    // Set HTTP-only cookie
    res.cookie("access_token", userLoginResponse.data.token, cookieOptions);

    // Return success response (without sensitive data)
    const { password: _, ...userWithoutPassword } = userLoginResponse.data.user;
    res.status(200).json(
      ApiResponse.success(200, "Login successful", {
        user: userWithoutPassword,
      })
    );
  });

  public logoutWeb = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new CustomError(
        ErrorType.unauthorized,
        401,
        "unauthenticated request"
      );
    }

    const logoutResponse = await this.userService.logoutUser(req.user.id);
    if (!logoutResponse.success) {
      throw new CustomError(
        ErrorType.internal_server_error,
        500,
        "logout failed",
        logoutResponse.error
      );
    }

    res.clearCookie("access_token");
    res.status(200).json(ApiResponse.success(200, "Logout successful", null));
  });

  public getAccount = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new CustomError(
        ErrorType.unauthorized,
        401,
        "unauthenticated request"
      );
    }

    const userResponse = await this.userService.findUserById(req.user.id);
    if (!userResponse.success || !userResponse.data) {
      throw new CustomError(
        ErrorType.unauthorized,
        401,
        "user not found",
        userResponse.error
      );
    }

    const { password: _, ...userWithoutPassword } = userResponse.data;
    res.status(200).json(
      ApiResponse.success(200, "User found", {
        user: userWithoutPassword,
      })
    );
  });

  public deleteAccount = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new CustomError(
        ErrorType.unauthorized,
        401,
        "unauthenticated request"
      );
    }

    const deleteResponse = await this.userService.deleteUser(req.user.id);
    if (!deleteResponse.success) {
      throw new CustomError(
        ErrorType.internal_server_error,
        500,
        "delete failed",
        deleteResponse.error
      );
    }

    res
      .status(200)
      .json(ApiResponse.success(200, "User deleted successfully", null));
  });
}

export default UserModule;
