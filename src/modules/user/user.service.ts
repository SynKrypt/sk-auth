import { PostgresService } from "../db/db.service.ts";
import bcrypt from "bcrypt";
import config from "@/config/env-config.ts";
import jwt from "jsonwebtoken";
import ServiceResponse from "../response/service-response.ts";

export interface IUserService {
  findUserByEmail(email: string): Promise<any>;
  createNewAdmin(email: string, password: string): Promise<any>;
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

  private async generateAccessToken(payload: any): Promise<string> {
    const token = await jwt.sign(payload, config.jwt.JWT_SECRET, {
      expiresIn: "1d",
    });
    return token;
  }
}
