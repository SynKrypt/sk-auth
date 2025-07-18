import { UUID } from "crypto";
import { v4 as uuid } from "uuid";
import { PrismaClient } from "@prisma/client";
import ServiceResponse from "../response/service-response.ts";

export interface IPostgresService {
  getUserById(userId: UUID): Promise<any>;
  getUserByEmail(email: string): Promise<any>;
  updateUserToken(userId: UUID, token: string): Promise<any>;
  createNewProject(orgId: UUID, projectName: string): Promise<any>;
  getOrganizationById(orgId: UUID): Promise<any>;
}

export class PostgresService implements IPostgresService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  public async getUserById(userId: UUID): Promise<any> {
    return { userId };
  }

  public async getUserByEmail(email: string): Promise<any> {
    try {
      const user = await this.prisma.userAccount.findUnique({
        where: {
          email,
        },
      });
      if (!user) {
        return ServiceResponse.failure("User not found");
      }
      return ServiceResponse.success(user);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  }

  public async updateUserToken(userId: UUID, token: string): Promise<any> {
    return { userId, token };
  }

  public async createNewProject(
    orgId: UUID,
    projectName: string
  ): Promise<any> {
    try {
      const project = await this.prisma.project.create({
        data: {
          id: uuid(),
          orgId,
          name: projectName,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return ServiceResponse.success(project);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  }

  public async getOrganizationById(orgId: UUID): Promise<any> {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: {
          id: orgId,
        },
      });
      return ServiceResponse.success(organization);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  }

  public async createUserByEmailAndPassword(
    email: string,
    hashedPassword: string
  ): Promise<any> {
    try {
      const user = await this.prisma.userAccount.create({
        data: {
          id: uuid(),
          email,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: "admin",
        },
      });
      return ServiceResponse.success(user);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  }

  public async createToken(
    userId: UUID,
    token: string,
    type: string,
    expiresAt: Date
  ): Promise<any> {
    try {
      const createdToken = await this.prisma.token.create({
        data: {
          id: uuid(),
          userId,
          token,
          createdAt: new Date(),
          updatedAt: new Date(),
          type,
          fingerprint: null,
          expiresAt,
          isValid: true,
        },
      });
      return ServiceResponse.success(createdToken);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  }
}
