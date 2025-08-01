import z from "zod";

export const project_name_schema = z
  .string()
  .min(3, "project name must be at least 3 characters long")
  .max(100, "project name must be at most 100 characters long")
  .regex(
    /^[A-Za-z][A-Za-z0-9_\-\s]+$/,
    "project name must start with a letter, can contain letters, numbers, underscore (_), dash (-) and whitespace."
  );
export const organization_name_schema = z
  .string()
  .min(3, "organization name must be at least 3 characters long")
  .max(100, "organization name must be at most 100 characters long")
  .regex(
    /^[A-Za-z][A-Za-z0-9_\-\s]+$/,
    "organization name must start with a letter, can contain letters, numbers, underscore (_), dash (-) and whitespace."
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
