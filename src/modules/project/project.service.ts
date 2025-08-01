import { PostgresService } from "../db/db.service.ts";
import ServiceResponse from "../response/service-response.ts";
import { UUID } from "crypto";
import { v4 as uuid } from "uuid";

interface IProjectService {
  createProject: (
    orgId: UUID,
    projectName: string,
    userId: UUID
  ) => Promise<ServiceResponse>;
  deleteProject: (projectId: UUID) => Promise<ServiceResponse>;
  createOrganization: (
    orgName: string,
    userId: UUID
  ) => Promise<ServiceResponse>;
  deleteOrganization: (orgId: UUID) => Promise<ServiceResponse>;
  getOrganizationData: (orgId: UUID) => Promise<ServiceResponse>;
}

class ProjectService implements IProjectService {
  private dbService: PostgresService;

  constructor() {
    this.dbService = new PostgresService();
  }

  public createProject = async (
    orgId: UUID,
    projectName: string,
    userId: UUID
  ) => {
    try {
      const result = await this.dbService.createProject(
        orgId,
        projectName,
        userId
      );
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
          org_id: orgId,
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

  public getProjectData = async (projectId: UUID) => {
    try {
      const result: any[] = await this.dbService.prisma.$queryRaw`
      SELECT
        proj.id AS projectId,
        proj.name AS projectName,
        COUNT(DISTINCT userAcc.id) AS userCount
      FROM "project" proj
      LEFT JOIN "user_account" userAcc
        ON proj.id = userAcc."org_id"
      WHERE proj.id = ${projectId}::uuid
      GROUP BY proj.id, proj.name
      `;
      if (result.length === 0) {
        return ServiceResponse.failure("no results found");
      }
      const parsedResults = result.map((result) => {
        return {
          projectId: result.projectId,
          projectName: result.projectName,
          userCount: Number(result.userCount),
        };
      });
      return ServiceResponse.success(parsedResults);
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
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
        // update user account with created orgId
        await txn.user_account.update({
          where: {
            id: userId,
          },
          data: {
            org_id: orgId,
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
            org_id: orgId,
          },
        });
        // delete all the tokens associated with the organization
        await txn.token.deleteMany({
          where: {
            org_id: orgId,
          },
        });
        // delete all the user accounts associated with the organization
        await txn.user_account.deleteMany({
          where: {
            org_id: orgId,
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

  public getOrganizationData = async (orgId: UUID) => {
    try {
      const results: any[] = await this.dbService.prisma.$queryRaw`
      SELECT
        org.id AS org_id,
        org.name AS org_name,
        COUNT(DISTINCT proj."org_id") AS projectCount,
        COUNT(DISTINCT userAcc."org_id") AS userCount
      FROM "organization" org
      LEFT JOIN "project" proj
        ON org.id = proj."org_id"
      LEFT JOIN "user_account" userAcc
        ON org.id = userAcc."org_id"
      WHERE org.id = ${orgId}::uuid
      GROUP BY org.id, org.name
      `;
      if (results.length === 0) {
        return ServiceResponse.failure("no results found");
      }
      const parsedResults = results.map((result) => {
        return {
          org_id: result.org_id,
          org_name: result.org_name,
          projectCount: Number(result.projectCount),
          userCount: Number(result.userCount),
        };
      });
      return ServiceResponse.success(parsedResults);
    } catch (error) {
      return ServiceResponse.failure(error);
    }
  };
}

export default ProjectService;
