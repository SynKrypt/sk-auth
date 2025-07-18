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
