import type { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config();

interface DatabaseConfig {
  DATABASE_URL?: string;
  DB_HOST?: string;
  DB_PORT: number;
  DB_USER?: string;
  DB_NAME?: string;
  DB_PASSWORD?: string;
  DB_SSL: boolean;
}

const config: DatabaseConfig = {
  DATABASE_URL: process.env.DATABASE_URL,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_SSL: process.env.DB_SSL === 'true'
};

interface KnexConfig {
  [key: string]: Knex.Config;
}

const knexConfig: KnexConfig = {
  development: {
    client: 'pg',
    connection: {
      connectionString: config.DATABASE_URL,
      host: config.DB_HOST,
      port: config.DB_PORT,
      user: config.DB_USER,
      database: config.DB_NAME,
      password: config.DB_PASSWORD,
      ssl: config.DB_SSL ? { rejectUnauthorized: false } : false,
    },
    migrations: {
      directory: './src/db/migrations',
      extension: 'ts'
    },
    seeds: {
      directory: './src/db/seeds',
      extension: 'ts'
    },
  },

  production: {
    client: 'pg',
    connection: {
      connectionString: config.DATABASE_URL,
      host: config.DB_HOST,
      port: config.DB_PORT,
      user: config.DB_USER,
      database: config.DB_NAME,
      password: config.DB_PASSWORD,
      ssl: config.DB_SSL ? { rejectUnauthorized: false } : false,
    },
    migrations: {
      directory: './dist/db/migrations',
      extension: 'js'
    },
    seeds: {
      directory: './dist/db/seeds',
      extension: 'js'
    },
  }
};

export default knexConfig;