import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, "..", "..", ".env");
dotenv.config({ path: envPath });

function getEnvVar(key: string, required = true): string {
  const value = process.env[key];
  // if (!value && required) {
  //   throw new Error(`Missing required environment variable: ${key}`);
  // }
  return value!;
}

export const API_KEY = getEnvVar('API_KEY');
export const PROVIDER = getEnvVar('PROVIDER', false) || 'openai';
export const MODEL = getEnvVar('MODEL', false) || 'gpt-4o-mini';
