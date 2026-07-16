import dotenv from "dotenv";
import {z} from "zod"
dotenv.config();

const envSchema=z.object({
    NODE_ENV:z.enum(["development","test","production"]).default("development"),
    PORT:z.coerce.number().int().positive(),
    DATABASE_URL: z.url(),
    REDIS_HOST: z.string().min(1),
    REDIS_PORT: z.coerce.number().int().positive(),
})
const parsed=envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:\n",
    parsed.error.flatten().fieldErrors
  );

  process.exit(1);
}

export const config = parsed.data;