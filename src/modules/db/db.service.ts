import { UUID } from "crypto";
import { v4 as uuid } from "uuid";
import { PrismaClient } from "@prisma/client";
import ServiceResponse from "../response/service-response.ts";

export interface IPostgresService {
  getUserById(userId: UUID): Promise<any>;
  getUserByEmail(email: string): Promise<any>;
  updateUserToken(userId: UUID, token: string): Promise<any>;
  createProject(orgId: UUID, projectName: string): Promise<any>;
  getOrganizationById(orgId: UUID): Promise<any>;
  createOrganization(orgName: string): Promise<any>;
  getTokenByValue(token: string): Promise<any>;
  deleteProjectById(projectId: UUID): Promise<any>;
  deleteOrganizationById(orgId: UUID): Promise<any>;
  deleteUserTokensByType(userId: UUID, tokenType: string): Promise<any>;
  deleteUserById(userId: UUID): Promise<any>;
  deleteTokenByID(tokenId: UUID): Promise<any>;
}

export class PostgresService implements IPostgresService {
  public readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  public async getUserById(userId: UUID): Promise<any> {
    try {
      const user = await this.prisma.userAccount.findUnique({
        where: { id: userId },
      });
      if (!user) {
        return ServiceResponse.failure("User not found");
      }
      return ServiceResponse.success(user);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
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

  public async deleteUserById(userId: UUID): Promise<any> {
    try {
      const result = await this.prisma.userAccount.delete({
        where: {
          id: userId,
        },
      });
      return ServiceResponse.success(result);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  }

  public async updateUserToken(userId: UUID, token: string): Promise<any> {
    return { userId, token };
  }

  public async getTokenByValue(token: string): Promise<any> {
    try {
      const tokenRecord = await this.prisma.token.findFirst({
        where: {
          token: token,
        },
      });

      if (!tokenRecord) {
        return ServiceResponse.failure("Token not found");
      }
      return ServiceResponse.success(tokenRecord);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  }

  public async deleteUserTokensByType(
    userId: UUID,
    tokenType: string
  ): Promise<any> {
    try {
      const result = await this.prisma.token.deleteMany({
        where: {
          userId: userId,
          type: tokenType,
        },
      });
      return ServiceResponse.success(result);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  }

  public async deleteTokenByID(tokenId: UUID): Promise<any> {
    try {
      const result = await this.prisma.token.delete({
        where: {
          id: tokenId,
        },
      });
      return ServiceResponse.success(result);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  }

  public async deleteAllUserTokens(userId: UUID): Promise<any> {
    try {
      const result = await this.prisma.token.deleteMany({
        where: {
          userId: userId,
        },
      });
      return ServiceResponse.success(result);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  }

  public async createProject(orgId: UUID, projectName: string): Promise<any> {
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

  public async deleteProjectById(projectId: UUID): Promise<any> {
    try {
      const result = await this.prisma.project.delete({
        where: {
          id: projectId,
        },
      });
      return ServiceResponse.success(result);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  }

  public async createOrganization(orgName: string): Promise<any> {
    try {
      const organization = await this.prisma.organization.create({
        data: {
          id: uuid(),
          name: orgName,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return ServiceResponse.success(organization);
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

  public async deleteOrganizationById(orgId: UUID): Promise<any> {
    try {
      const result = await this.prisma.organization.delete({
        where: {
          id: orgId,
        },
      });
      return ServiceResponse.success(result);
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
