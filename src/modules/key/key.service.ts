import { createHash } from "crypto";
import { sign, verify } from "jsonwebtoken";
import { PostgresService } from "../db/db.service.js";
import { CustomError, ErrorType } from "../response/api-response.js";
import config from "../../config/env-config.js";
import { UUID } from "crypto";
import ServiceResponse from "../response/service-response.ts";

export interface IKeyService {
  createToken(
    role: string,
    email: string,
    userId: UUID
  ): Promise<ServiceResponse>;
}

export class KeyService implements IKeyService {
  private dbService: PostgresService;

  constructor() {
    this.dbService = new PostgresService();
  }

  private generateTokenFingerprint(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  public async createToken(role: string, email: string, userId: UUID) {
    try {
      // Create JWT token with role and email in the payload
      const token = sign(
        {
          role,
          email,
          userId,
          tokenType: "key-gen",
          iat: Math.floor(Date.now() / 1000),
        },
        config.jwt.JWT_SECRET,
        {
          expiresIn: config.jwt.JWT_EXPIRES_IN,
          issuer: "sk-auth-service",
        }
      );

      // Generate fingerprint
      const fingerprint = this.generateTokenFingerprint(token);

      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store the token in the database
      const result = await this.dbService.prisma.token.create({
        data: {
          userId,
          token,
          type: "key-gen",
          fingerprint,
          isValid: true,
          expiresAt,
        },
        select: { id: true },
      });

      if (!result) {
        return ServiceResponse.failure("Failed to store token in database");
      }

      return ServiceResponse.success({ token });
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  }

  public async verifyToken(token: string) {
    try {
      // decode the token
      const decodedToken = verify(token, config.jwt.JWT_SECRET);
      const tokenRecord = await this.dbService.getTokenByValue(token);
      if (!tokenRecord.success || !tokenRecord.data) {
        return ServiceResponse.failure("Token not found");
      }
      // check the validity of the token
      if (
        tokenRecord.data.isValid === false ||
        tokenRecord.data.expiresAt < new Date()
      ) {
        return ServiceResponse.failure("Invalid token");
      }
      // delete the token after verification
      await this.dbService.deleteTokenByID(tokenRecord.data.id);
      return ServiceResponse.success(decodedToken);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  }
}
