import { PostgresService } from "../db/db.service.ts";
import ServiceResponse from "../response/service-response.ts";
import { UUID } from "crypto";
import { v4 as uuid } from "uuid";

interface IProjectService {
  createProject: (orgId: UUID, projectName: string) => Promise<ServiceResponse>;
  deleteProject: (projectId: UUID) => Promise<ServiceResponse>;
  createOrganization: (
    orgName: string,
    userId: UUID
  ) => Promise<ServiceResponse>;
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

  public getProjectByName = async (orgId: UUID, projectName: string) => {
    try {
      const result = await this.dbService.prisma.project.findUnique({
        where: {
          orgId,
          name: projectName,
        },
      });
      if (!result) {
        return ServiceResponse.failure("project not found");
      }
      return ServiceResponse.success(result);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  };

  public getProjectById = async (projectId: UUID) => {
    try {
      const result = await this.dbService.prisma.project.findUnique({
        where: {
          id: projectId,
        },
      });
      if (!result) {
        return ServiceResponse.failure("project not found");
      }
      return ServiceResponse.success(result);
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
      return ServiceResponse.success(null);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  };

  public createOrganization = async (orgName: string, userId: UUID) => {
    try {
      const result = await this.dbService.prisma.$transaction(async (txn) => {
        const orgId = uuid();
        // create new organization
        await txn.organization.create({
          data: {
            id: orgId,
            name: orgName,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        // update user account with created orgId
        await txn.userAccount.update({
          where: {
            id: userId,
          },
          data: {
            orgId: orgId,
          },
        });
        return ServiceResponse.success({ org_id: orgId, org_name: orgName });
      });
      if (!result.success) {
        return ServiceResponse.failure(result.error);
      }
      return ServiceResponse.success(result.data);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  };

  public getOrganizationByName = async (orgName: string) => {
    try {
      const result = await this.dbService.prisma.organization.findUnique({
        where: {
          name: orgName,
        },
      });
      if (!result) {
        return ServiceResponse.failure("organization not found");
      }
      return ServiceResponse.success(result);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  };

  public getOrganizationById = async (orgId: UUID) => {
    try {
      const result = await this.dbService.prisma.organization.findUnique({
        where: {
          id: orgId,
        },
      });
      if (!result) {
        return ServiceResponse.failure("organization not found");
      }
      return ServiceResponse.success(result);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  };

  public deleteOrganization = async (orgId: UUID) => {
    try {
      const result = await this.dbService.prisma.$transaction(async (txn) => {
        // delete organization
        await txn.organization.delete({
          where: {
            id: orgId,
          },
        });
        // delete all the projects associated with the organization
        await txn.project.deleteMany({
          where: {
            orgId: orgId,
          },
        });
        // delete all the tokens associated with the organization
        await txn.token.deleteMany({
          where: {
            orgId: orgId,
          },
        });
        // delete all the user accounts associated with the organization
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
