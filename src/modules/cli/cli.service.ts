import { randomDigitIDGenerator } from "@/utils/random-id-generator.ts";
import { PostgresService } from "../db/db.service.ts";
import ServiceResponse from "../response/service-response.ts";
import crypto, { createHash, UUID } from "node:crypto";
import jwt from "jsonwebtoken";
import config from "@/config/env-config.ts";

export interface ICLIService {
  generateNonce(): any;
  isNonceValid(nonce: string): Promise<any>;
}

class CLIService implements ICLIService {
  private readonly dbService: PostgresService;
  constructor() {
    this.dbService = new PostgresService();
  }

  // PRIVATE METHODS
  private createJWTToken(payload: any): string {
    const token = jwt.sign(payload, config.jwt.JWT_SECRET, {
      expiresIn: config.jwt.JWT_EXPIRES_IN,
      issuer: "sk-auth-service",
    });
    return token;
  }

  private createFingerprint(token: string): string {
    const hash = createHash("sha256");
    hash.update(token);
    return hash.digest("hex");
  }

  // PUBLIC METHODS
  public generateNonce(): any {
    const nonce = String(randomDigitIDGenerator(10));
    return ServiceResponse.success({ nonce });
  }

  public async saveNonceToDB(nonce: string, userId: UUID): Promise<any> {
    try {
      const response = await this.dbService.createToken(
        userId,
        nonce,
        "nonce",
        new Date(Date.now() + 30 * 1000),
      );
      if (!response.success) {
        return ServiceResponse.failure(response.error);
      }
      return ServiceResponse.success(response.data);
    } catch (error: any) {
      return ServiceResponse.failure(error);
    }
  }

  public async isNonceValid(nonce: string): Promise<any> {
    try {
      const response = await this.dbService.getTokenByValue(nonce);
      if (!response.success) {
        return ServiceResponse.failure("nonce not found");
      }
      const token = response.data;
      if (!token) {
        return ServiceResponse.failure("nonce not found");
      }
      if (!token.is_valid) {
        return ServiceResponse.failure("nonce already used once");
      }
      if (token.expires_at < new Date()) {
        return ServiceResponse.failure("nonce expired");
      }
      return ServiceResponse.success({
        userId: token.user_id,
        nonceId: token.id,
      });
    } catch (error: any) {
      return ServiceResponse.failure(error);
    }
  }

  public async getPublicKeyFromUserId(userId: UUID): Promise<any> {
    try {
      // check if user exists
      const response = await this.dbService.getUserById(userId);
      if (!response.success) {
        return ServiceResponse.failure(response.error);
      }
      const user = response.data;
      if (!user) {
        return ServiceResponse.failure("user not found");
      }
      // get the public key associated with the user
      const publicKey = await this.dbService.prisma.key.findUnique({
        where: {
          user_id: userId,
        },
      });
      if (!publicKey) {
        return ServiceResponse.failure("public key not found");
      }
      return ServiceResponse.success({
        publicKey,
      });
    } catch (error: any) {
      return ServiceResponse.failure(error);
    }
  }

  public async verifySignature(
    payload: any,
    signature: string,
    publicKey: string,
  ): Promise<any> {
    try {
      // TODO: verify the signature using the public key
      /*
        public key => string
        signature => base64 encoded string
        payload => object

        For Verification:
        signature => buffer
        public key => string
        payload => buffer
      */

      const signatureBuffer = Buffer.from(signature, "base64");
      const payloadBuffer = Buffer.from(JSON.stringify(payload), "utf8");

      const isVerified = crypto.verify(
        "sha256",
        payloadBuffer,
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        },
        signatureBuffer,
      );

      if (isVerified) {
        return ServiceResponse.success({
          isVerified,
        });
      }
      return ServiceResponse.failure("signature verification failed");
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  }

  public async invalidateNonce(nonceId: UUID): Promise<any> {
    try {
      const response = await this.dbService.prisma.token.update({
        where: {
          id: nonceId,
        },
        data: {
          is_valid: false,
        },
      });
      if (!response) {
        return ServiceResponse.failure("nonce not found");
      }
      return ServiceResponse.success(true);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  }

  public async createSession(userId: UUID, type: string): Promise<any> {
    try {
      // check for any existing 'valid' session token for the user
      const existingValidSessionToken =
        await this.dbService.prisma.token.findFirst({
          where: {
            user_id: userId,
            is_valid: true,
            type,
          },
        });
      if (existingValidSessionToken) {
        return ServiceResponse.success(existingValidSessionToken);
      }
      // create a session token using JWT
      const jwtPayload = {
        userId,
        type,
        iat: Math.floor(Date.now() / 1000),
      };
      const sessionToken = this.createJWTToken(jwtPayload);

      // create a fingerprint of the session token
      const sessionTokenFingerprint = this.createFingerprint(sessionToken);

      // store the session token in the DB
      const response = await this.dbService.prisma.token.create({
        data: {
          user_id: userId,
          token: sessionToken,
          fingerprint: sessionTokenFingerprint,
          type,
          is_valid: true,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        },
      });
      if (!response) {
        return ServiceResponse.failure("session creation failed");
      }
      return ServiceResponse.success(response);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  }
}

export default CLIService;
