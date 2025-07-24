import { PostgresService } from "../db/db.service.ts";
import bcrypt from "bcrypt";
import config from "@/config/env-config.ts";
import jwt from "jsonwebtoken";
import ServiceResponse from "../response/service-response.ts";
import { UUID } from "crypto";

export interface IUserService {
  findUserByEmail(email: string): Promise<any>;
  createNewAdmin(email: string, password: string): Promise<any>;
  findUserById(id: UUID): Promise<any>;
  deleteUser(id: UUID): Promise<any>;
}

export class UserService implements IUserService {
  private dbService: PostgresService;

  constructor() {
    this.dbService = new PostgresService();
  }

  public async findUserByEmail(email: string): Promise<any> {
    try {
      const userFromDB = await this.dbService.getUserByEmail(email);
      if (!userFromDB.success) {
        return ServiceResponse.failure(userFromDB.error);
      }
      return ServiceResponse.success(userFromDB.data);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  }

  public async findUserById(id: UUID): Promise<any> {
    try {
      const userFromDB = await this.dbService.getUserById(id);
      if (!userFromDB.success) {
        return ServiceResponse.failure(userFromDB.error);
      }
      return ServiceResponse.success(userFromDB.data);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  }

  public async createNewAdmin(email: string, password: string): Promise<any> {
    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user
      const user = await this.dbService.createUserByEmailAndPassword(
        email,
        hashedPassword
      );
      if (!user.success) {
        return ServiceResponse.failure(user.error);
      }

      // Create an access token
      const accessToken = await this.generateAccessToken({
        id: user.data.id,
        email: user.data.email,
      });

      // Store the access token in DB
      const tokenResponse = await this.dbService.createToken(
        user.data.id,
        accessToken,
        "web-session",
        new Date(Date.now() + 1000 * 60 * 60 * 24)
      );
      if (!tokenResponse.success) {
        return ServiceResponse.failure(tokenResponse.error);
      }

      // Send user response with access token
      return ServiceResponse.success({ user: user.data, token: accessToken });
    } catch (error: any) {
      return ServiceResponse.failure(error);
    }
  }

  public async loginUser(
    email: string,
    password: string,
    user: any
  ): Promise<any> {
    try {
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return ServiceResponse.failure("password mismatch");
      }

      // Check if user is an admin
      if (user.role !== "admin") {
        return ServiceResponse.failure("admin privileges required.");
      }

      // Generate JWT token
      const tokenPayload = { id: user.id, email: user.email, role: user.role };
      const token = await this.generateAccessToken(tokenPayload);

      // Save token in the DB
      const tokenResponse = await this.dbService.createToken(
        user.id,
        token,
        "web-session",
        new Date(Date.now() + 1000 * 60 * 60 * 24)
      );
      if (!tokenResponse.success) {
        return ServiceResponse.failure(tokenResponse.error);
      }

      // Send user response with access token
      return ServiceResponse.success({ user: user, token: token });
    } catch (error: any) {
      return ServiceResponse.failure(error);
    }
  }

  public async logoutUser(userId: UUID): Promise<any> {
    try {
      const result = await this.dbService.deleteUserTokensByType(
        userId,
        "web-session"
      );
      if (!result.success) {
        return ServiceResponse.failure(result.error);
      }
      return ServiceResponse.success(null);
    } catch (error: any) {
      return ServiceResponse.failure(error);
    }
  }

  public async deleteUser(userId: UUID): Promise<any> {
    try {
      await this.dbService.prisma.$transaction(async (txn) => {
        // delete all tokens of the user
        /*
          NOTE
          - user cannot be deleted before its tokens because of the schema design
          - each token entry must have a valid userId
          - so token must be deleted first
        */
        await txn.token.deleteMany({
          where: {
            userId: userId,
          },
        });
        // delete the user
        await txn.userAccount.delete({
          where: {
            id: userId,
          },
        });
      });
      return ServiceResponse.success(null);
    } catch (error: any) {
      return ServiceResponse.failure(error);
    }
  }

  private async generateAccessToken(payload: any): Promise<string> {
    const token = await jwt.sign(payload, config.jwt.JWT_SECRET, {
      expiresIn: "1d",
    });
    return token;
  }
}
