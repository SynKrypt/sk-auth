import { z } from "zod";

const envSchema = z.object({
  app: z.object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.number().default(3000),
  }),
  db: z.object({
    DB_URL: z.string().min(1),
  }),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error("invalid environment variables");
  process.exit(1);
}

export const config = env.data;
