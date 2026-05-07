import { config } from "dotenv";

config();

/**
 * Reads a required environment variable value.
 */
export function getEnvVar(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

/**
 * Reads an optional environment variable value.
 */
export function getOptionalEnvVar(name: string): string | undefined {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  return value;
}
