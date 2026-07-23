import { z } from "zod";

const configSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AWS_REGION: z.string().default("us-east-1"),
  BEDROCK_REASONING_MODEL_ID: z
    .string()
    .default("global.amazon.nova-2-lite-v1:0"),
  BEDROCK_EMBEDDING_MODEL_ID: z
    .string()
    .default("amazon.titan-embed-text-v2:0"),
  EMBEDDING_DIMENSIONS: z.coerce.number().int().refine((value: number) => [256, 512, 1024].includes(value), {
    message: "EMBEDDING_DIMENSIONS must be 256, 512, or 1024"
  }).default(512),
  MODEL_MODE: z.enum(["bedrock", "hybrid", "deterministic"]).default("bedrock"),
  EXPORT_BUCKET: z.string().optional(),
  ALLOWED_ORIGIN: z.string().default("*")
});

export interface AppConfig {
  DATABASE_URL: string;
  AWS_REGION: string;
  BEDROCK_REASONING_MODEL_ID: string;
  BEDROCK_EMBEDDING_MODEL_ID: string;
  EMBEDDING_DIMENSIONS: number;
  MODEL_MODE: "bedrock" | "hybrid" | "deterministic";
  EXPORT_BUCKET?: string;
  ALLOWED_ORIGIN: string;
}

let cached: AppConfig | undefined;

export function getConfig(): AppConfig {
  if (cached) return cached;
  const parsed = configSchema.parse(process.env) as AppConfig;
  cached = parsed;
  return parsed;
}

export function setConfigForTests(config: AppConfig | undefined): void {
  cached = config;
}
