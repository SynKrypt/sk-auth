import z from "zod";

export const organization_name_schema = z
  .string()
  .min(3, "Organization name must be at least 3 characters long")
  .max(100, "Organization name must be at most 100 characters long")
  .regex(
    /^[a-zA-Z0-9_ ]+$/,
    "Organization name can only contain letters, numbers, and spaces"
  );
export const project_name_schema = z
  .string()
  .min(3, "Project name must be at least 3 characters long")
  .max(100, "Project name must be at most 100 characters long")
  .regex(
    /^[a-zA-Z0-9_ ]+$/,
    "Project name can only contain letters, numbers, and spaces"
  );

export const project_creation_schema = z.object({
  orgId: z.string().uuid("Invalid organization ID"),
  projectName: project_name_schema,
});

export const project_deletion_schema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
});

export const organization_creation_schema = z.object({
  orgName: organization_name_schema,
});

export const organization_deletion_schema = z.object({
  orgId: z.string().uuid("Invalid organization ID"),
});
