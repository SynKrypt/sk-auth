import { PostgresService } from "../db/db.service.ts";
import ServiceResponse from "../response/service-response.ts";
import { UUID } from "crypto";

interface IProjectService {
  createProject: (orgId: UUID, projectName: string) => Promise<ServiceResponse>;
  deleteProject: (projectId: UUID) => Promise<ServiceResponse>;
  createOrganization: (orgName: string) => Promise<ServiceResponse>;
  deleteOrganization: (orgId: UUID) => Promise<ServiceResponse>;
}

class ProjectService implements IProjectService {
  private dbService: PostgresService;

  constructor() {
    this.dbService = new PostgresService();
  }

  public createProject = async (orgId: UUID, projectName: string) => {
    try {
      const result = await this.dbService.createProject(orgId, projectName);
      if (!result.success) {
        return ServiceResponse.failure(result.error);
      }
      return ServiceResponse.success(result.data);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  };

  public deleteProject = async (projectId: UUID) => {
    try {
      const result = await this.dbService.deleteProjectById(projectId);
      if (!result.success) {
        return ServiceResponse.failure(result.error);
      }
      return ServiceResponse.success(result.data);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  };

  public createOrganization = async (orgName: string) => {
    try {
      const result = await this.dbService.createOrganization(orgName);
      if (!result.success) {
        return ServiceResponse.failure(result.error);
      }
      return ServiceResponse.success(result.data);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  };

  public deleteOrganization = async (orgId: UUID) => {
    try {
      const result = await this.dbService.prisma.$transaction(async (txn) => {
        await txn.organization.delete({
          where: {
            id: orgId,
          },
        });
        await txn.project.deleteMany({
          where: {
            orgId: orgId,
          },
        });
        await txn.token.deleteMany({
          where: {
            orgId: orgId,
          },
        });
        await txn.userAccount.deleteMany({
          where: {
            orgId: orgId,
          },
        });
        return ServiceResponse.success(null);
      });
      if (!result.success) {
        return ServiceResponse.failure(result.error);
      }
      return ServiceResponse.success(result.data);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  };
}

export default ProjectService;
