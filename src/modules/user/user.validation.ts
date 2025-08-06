import { z } from "zod";

export const email_schema = z.string().email("invalid email");
export const password_schema = z
  .string()
  .min(8, "password must be at least 8 characters long")
  .max(32, "password must be at most 32 characters long")
  .regex(/[a-z]/, "password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "password must contain at least one uppercase letter")
  .regex(/[0-9]/, "password must contain at least one number")
  .regex(
    /[^a-zA-Z0-9]/,
    "password must contain at least one special character"
  );
export const organizationId_schema = z
  .string()
  .uuid("invalid organization id. organization-ID must be of UUID type");

export const loginSchema = z.object({
  email: email_schema,
  password: z.string().min(1, "Password is required"),
});

export const userCreationSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  orgId: z.string().uuid("Invalid organization ID"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name must be at most 100 characters long")
    .regex(/^[a-zA-Z ]+$/, "Name must contain only letters and spaces"),
  email: email_schema,
  role: z.enum(["admin", "viewer", "maintainer"], { message: "Invalid role" }),
});

export type UserCreationInput = z.infer<typeof userCreationSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
