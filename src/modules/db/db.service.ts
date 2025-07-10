import { UUID } from "crypto";
import { v4 as uuid } from "uuid";
import { PrismaClient } from "@prisma/client";
import { CustomError, ErrorType } from "../api-response/api-response.ts";

export interface IPostgresService {
  getUserById(userId: UUID): Promise<any>;
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
          org_id: orgId,
          name: projectName,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return project;
    } catch (error) {
      throw new CustomError(
        ErrorType.database_error,
        500,
        "error in createNewProject",
        error
      );
    }
  }

  public async getOrganizationById(orgId: UUID): Promise<any> {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: {
          id: orgId,
        },
      });
      return organization;
    } catch (error) {
      throw new CustomError(
        ErrorType.database_error,
        500,
        "error in getOrganizationById",
        error
      );
    }
  }
}
