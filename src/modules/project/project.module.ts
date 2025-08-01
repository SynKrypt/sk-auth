import asyncHandler from "@/utils/async-handler.ts";
import { Request, Response } from "express";
import ProjectService from "./project.service.ts";
import { CustomError, ErrorType } from "../response/api-response.ts";
import {
  organization_creation_schema,
  project_creation_schema,
  project_deletion_schema,
  organization_deletion_schema,
} from "./project.validation.ts";
import ApiResponse from "../response/api-response.ts";

interface IProjectModule {
  createNewOrganization: (req: Request, res: Response) => Promise<void>;
  createNewProject: (req: Request, res: Response) => Promise<void>;
  deleteProject: (req: Request, res: Response) => Promise<void>;
  deleteOrganization: (req: Request, res: Response) => Promise<void>;
}

class ProjectModule implements IProjectModule {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  public createNewOrganization = asyncHandler(
    async (req: Request, res: Response) => {
      const { orgName } = req.body;
      // validations
      const validationResult = organization_creation_schema.safeParse({
        orgName,
      });
      if (!validationResult.success) {
        throw new CustomError(
          ErrorType.validation_error,
          400,
          "validation error",
          validationResult.error.errors
        );
      }

      // check if organization already exists
      const organizationExists =
        await this.projectService.getOrganizationByName(orgName);
      if (organizationExists.success) {
        throw new CustomError(
          ErrorType.already_exists,
          400,
          "organization already exists"
        );
      }

      // create a new organization and update it in the user's entry in DB
      const result = await this.projectService.createOrganization(
        orgName,
        req.user.id
      );
      if (!result.success) {
        throw new CustomError(
          ErrorType.database_error,
          500,
          "organization creation failed",
          result.error
        );
      }

      res
        .status(201)
        .json(
          ApiResponse.success(
            201,
            "organization created successfully",
            result.data
          )
        );
    }
  );

  public deleteOrganization = asyncHandler(
    async (req: Request, res: Response) => {
      const { orgId } = req.body;
      // validations
      const validationResult = organization_deletion_schema.safeParse({
        orgId,
      });
      if (!validationResult.success) {
        throw new CustomError(
          ErrorType.validation_error,
          400,
          "validation error",
          validationResult.error.errors
        );
      }

      // check if the organization exists
      const organizationExists =
        await this.projectService.getOrganizationById(orgId);
      if (!organizationExists.success) {
        throw new CustomError(
          ErrorType.validation_error,
          400,
          "organization does not exist"
        );
      }

      // delete the organization from DB
      const result = await this.projectService.deleteOrganization(orgId);
      if (!result.success) {
        throw new CustomError(
          ErrorType.database_error,
          500,
          "organization deletion failed",
          result.error
        );
      }

      res
        .status(200)
        .json(
          ApiResponse.success(
            200,
            "organization deleted successfully",
            result.data
          )
        );
    }
  );

  public createNewProject = asyncHandler(
    async (req: Request, res: Response) => {
      const { orgId, projectName } = req.body;
      // validations
      const validationResult = project_creation_schema.safeParse({
        orgId,
        projectName,
      });
      if (!validationResult.success) {
        throw new CustomError(
          ErrorType.validation_error,
          400,
          "validation error",
          validationResult.error.errors
        );
      }

      // check if a project already exists with the same name
      const projectExists = await this.projectService.getProjectByName(
        orgId,
        projectName
      );
      if (projectExists.success) {
        throw new CustomError(
          ErrorType.validation_error,
          400,
          "project already exists"
        );
      }

      // create a new project
      const result = await this.projectService.createProject(
        orgId,
        projectName
      );
      if (!result.success) {
        throw new CustomError(
          ErrorType.database_error,
          500,
          "project creation failed",
          result.error
        );
      }

      res
        .status(201)
        .json(
          ApiResponse.success(201, "project created successfully", result.data)
        );
    }
  );

  public deleteProject = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.body;
    // validations
    const validationResult = project_deletion_schema.safeParse({
      projectId,
    });
    if (!validationResult.success) {
      throw new CustomError(
        ErrorType.validation_error,
        400,
        "validation error",
        validationResult.error.errors
      );
    }

    // check if the project exists
    const projectExists = await this.projectService.getProjectById(projectId);
    if (!projectExists.success) {
      throw new CustomError(
        ErrorType.validation_error,
        400,
        "project does not exist"
      );
    }

    // delete the project from DB
    const result = await this.projectService.deleteProject(projectId);
    if (!result.success) {
      throw new CustomError(
        ErrorType.database_error,
        500,
        "project deletion failed",
        result.error
      );
    }

    res
      .status(200)
      .json(
        ApiResponse.success(200, "project deleted successfully", result.data)
      );
  });
}

export default ProjectModule;
