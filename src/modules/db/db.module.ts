import { UUID } from "crypto";
import { IPostgresService, PostgresService } from "./db.service.ts";
import { Project } from "@prisma/client";
import { CustomError, ErrorType } from "../response/api-response.ts";

export interface IDBModule {
  getUserById(userId: UUID): Promise<any>;
  updateUserToken(userId: UUID, token: string): Promise<any>;
  createNewProject(orgId: UUID, projectName: string): Promise<Project>;
}

export default class DBModule implements IDBModule {
  private readonly dbService: IPostgresService;

  constructor() {
    this.dbService = new PostgresService();
  }

  public async getUserById(userId: UUID): Promise<any> {
    return this.dbService.getUserById(userId);
  }

  public async updateUserToken(userId: UUID, token: string): Promise<any> {
    return this.dbService.updateUserToken(userId, token);
  }

  public async createNewProject(
    orgId: UUID,
    projectName: string
  ): Promise<any> {
    try {
      // Check if the organization exists
      const organization = await this.dbService.getOrganizationById(orgId);
      if (!organization) {
        throw new CustomError(
          ErrorType.database_error,
          404,
          "organization not found"
        );
      }

      // Create a new project mapped to the provided organization
      const project = await this.dbService.createNewProject(orgId, projectName);
      return project;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorType.database_error,
        500,
        "error in createNewProject",
        error
      );
    }
  }
}
