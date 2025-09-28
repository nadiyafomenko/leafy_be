import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 8001,
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV || "development",
  API_URL: process.env.API_URL,
};