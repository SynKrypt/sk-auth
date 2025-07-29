import { z } from "zod";

export const key_creation_schema = z.object({
  role: z.string().min(1, "Role is required"),
  email: z.string().email("Invalid email format"),
});

export const key_verification_schema = z.object({
  oneTimeToken: z.string().min(1, "One time token is required"),
});

export type KeyCreationInput = z.infer<typeof key_creation_schema>;
export type KeyVerificationInput = z.infer<typeof key_verification_schema>;
