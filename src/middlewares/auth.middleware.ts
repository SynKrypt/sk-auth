import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config/env-config.ts";
import { PostgresService } from "../modules/db/db.service.ts";
import { CustomError, ErrorType } from "../modules/response/api-response.ts";

import { UUID } from "crypto";
import asyncHandler from "@/utils/async-handler.ts";

interface JwtPayload {
  id: UUID;
  email: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request type to include user property
/*
    NOTE
    - global keyword takes the scope of this object out of this file to the global scope (accessible everywhere now)
    - namespace Express (maintained by @types/express) is extended to include user property
*/
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const dbService = new PostgresService();

export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Get token from cookies
      const token = req.cookies?.access_token;
      if (!token) {
        throw new CustomError(
          ErrorType.unauthorized,
          401,
          "Authentication required. No access token found."
        );
      }
      console.log("token", token);

      // Verify JWT token
      let decoded: JwtPayload;
      try {
        decoded = jwt.verify(token, config.jwt.JWT_SECRET) as JwtPayload;
      } catch (error) {
        throw new CustomError(
          ErrorType.invalid_token,
          401,
          "Invalid or expired token"
        );
      }
      console.log("decoded", decoded);

      // Check if token exists and is valid in the database
      const tokenResponse = await dbService.getTokenByValue(token);
      console.log("tokenResponse", tokenResponse);
      if (!tokenResponse.success || !tokenResponse.data) {
        throw new CustomError(
          ErrorType.invalid_token,
          401,
          "Invalid token. Please log in again."
        );
      }

      const tokenRecord = tokenResponse.data;
      if (
        !tokenRecord.is_valid ||
        (tokenRecord.expires_at &&
          new Date() > new Date(tokenRecord.expires_at))
      ) {
        console.log("expires at ", tokenRecord.expires_at);
        console.log("is valid ", tokenRecord.is_valid);
        throw new CustomError(
          ErrorType.token_expired,
          401,
          "Session expired. Please log in again."
        );
      }

      // Get user information and attach it to the request object
      const userId = decoded.id as UUID;
      const userResponse = await dbService.getUserById(userId);
      if (!userResponse.success || !userResponse.data) {
        throw new CustomError(ErrorType.not_found, 404, "User not found");
      }
      req.user = userResponse.data;
      next();
    } catch (error) {
      throw error;
    }
  }
);

/**
 * Role-based authorization middleware
 * @param roles Array of allowed roles
 */
export const authorize = (roles: string[] = []) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new CustomError(
          ErrorType.unauthorized,
          401,
          "Authentication required"
        );
      }

      if (roles.length && !roles.includes(req.user.role)) {
        throw new CustomError(
          ErrorType.forbidden,
          403,
          "You don't have permission to access this resource"
        );
      }

      next();
    } catch (error) {
      throw error;
    }
  };
};

export default {
  authenticate,
  authorize,
};
