import dotenv from 'dotenv';
dotenv.config();

function getEnvVar(key: string, required = true): string {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value!;
}

export const PORT = getEnvVar('PORT');
export const API_KEY = getEnvVar('OPENAI_API_KEY');