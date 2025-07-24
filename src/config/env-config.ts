import { z } from "zod";

export const envSchema = z.object({
  app: z.object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.number().default(3000),
  }),
  db: z.object({
    DB_URL: z.string().min(1),
  }),
  jwt: z.object({
    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.number().default(86400), // 24 hours in seconds
  }),
});

export const envConfig = {
  app: {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: Number(process.env.PORT) || 3000,
  },
  db: {
    DB_URL: process.env.DB_URL || "",
  },
  jwt: {
    JWT_SECRET: process.env.JWT_SECRET || "",
    JWT_EXPIRES_IN: Number(process.env.JWT_EXPIRES_IN) || 86400,
  },
};

let config: z.infer<typeof envSchema>;

export function configureEnvironment(): z.infer<typeof envSchema> {
  if (config) return config;

  console.log("configuring environment variables...");
  const env = envSchema.safeParse(envConfig);
  if (!env.success) {
    console.log("invalid environment variables", env.error);
    process.exit(1);
  } else {
    console.log("environment variables configured successfully");
    config = env.data;
    return env.data;
  }
}

export default configureEnvironment();
