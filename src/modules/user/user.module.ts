import { Request, Response } from "express";
import { UserService } from "./user.service.ts";
import asyncHandler from "@/utils/async-handler.ts";
import ApiResponse, {
  CustomError,
  ErrorType,
} from "../response/api-response.ts";

export interface IUserModule {
  registerWeb(req: Request, res: Response): Promise<any>;
}

class UserModule implements IUserModule {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
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
    // Email validation
    // Password validation
    // Check if organization exists

    // Check if user already exists
    const userFromDB = await this.userService.findUserByEmail(email);
    if (userFromDB.success) {
      throw new CustomError(
        ErrorType.database_error,
        400,
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
