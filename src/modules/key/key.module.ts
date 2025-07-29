import { Request, Response } from "express";
import { KeyService } from "./key.service.js";
import {
  key_creation_schema,
  key_verification_schema,
} from "./key.validation.js";
import { CustomError, ErrorType } from "../response/api-response.js";
import asyncHandler from "../../utils/async-handler.js";
import { PostgresService } from "../db/db.service.js";

export class KeyModule {
  private dbService: PostgresService;
  private keyService: KeyService;

  constructor() {
    this.dbService = new PostgresService();
    this.keyService = new KeyService();
  }

  public createKeyGenerationOneTimeToken = asyncHandler(
    async (req: Request, res: Response) => {
      const { role, email } = req.query;

      // Validate query parameters
      const validationResult = key_creation_schema.safeParse({ role, email });
      if (!validationResult.success) {
        throw new CustomError(
          ErrorType.validation_error,
          400,
          "Invalid input",
          validationResult.error.errors
        );
      }

      // Check if the user exists
      const userResponse = await this.dbService.getUserByEmail(email as string);
      if (!userResponse.success || !userResponse.data) {
        throw new CustomError(ErrorType.not_found, 404, "User not found");
      }

      // Create the key
      const keyResult = await this.keyService.createToken(
        role as string,
        email as string,
        userResponse.data.id
      );

      if (!keyResult.success) {
        throw new CustomError(
          ErrorType.internal_server_error,
          500,
          "Failed to create key",
          keyResult.error
        );
      }

      // Send the token to the user via email
      // const emailResponse = await this.emailService.sendEmail(email as string, keyResult.data.token);
      // if (!emailResponse.success) {
      //   throw new CustomError(
      //     ErrorType.internal_server_error,
      //     500,
      //     "Failed to send email",
      //     emailResponse.error
      //   );
      // }

      // Return the token in the response
      res.status(201).json({
        success: true,
        data: {
          token: keyResult.data?.token,
        },
      });
    }
  );

  public verifyKeyGenerationOneTimeToken = asyncHandler(
    async (req: Request, res: Response) => {
      const { oneTimeToken: token } = req.body;

      // Validate query parameters
      const validationResult = key_verification_schema.safeParse({ token });
      if (!validationResult.success) {
        throw new CustomError(
          ErrorType.validation_error,
          400,
          "Invalid input",
          validationResult.error.errors
        );
      }

      // Verify the token
      const tokenResult = await this.keyService.verifyToken(token as string);

      if (!tokenResult.success) {
        throw new CustomError(
          ErrorType.internal_server_error,
          500,
          "Failed to verify token",
          tokenResult.error
        );
      }

      // Return the token in the response
      res.status(201).json({
        success: true,
        data: {
          token: tokenResult.data?.token,
        },
      });
    }
  );
}

export default KeyModule;
