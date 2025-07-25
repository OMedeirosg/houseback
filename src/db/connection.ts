import knex from "knex";
import dotenv from "dotenv";
import { success } from "../utils/logger";
import { error } from "console";

dotenv.config();

const config = {
    DATABASE_URL: process.env.DATABASE_URL,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432, // ← Conversão
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_SSL: process.env.DB_SSL === 'true'
};

const db = knex({
    client: 'pg',
    connection: {
        connectionString: config.DATABASE_URL,
        host: config.DB_HOST,
        port: config.DB_PORT, // ← Agora é number
        user: config.DB_USER,
        database: config.DB_NAME,
        password: config.DB_PASSWORD,
        ssl: config.DB_SSL ? { rejectUnauthorized: false } : false,
    },
});


// função para testar conexão
export const testDbConnection = async () => {
    try {
        await db.raw(`  
            CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`);
        success("Database connection successful");
    } catch (err) {
        error("Database connection failed", err);
        process.exit(1); // encerra aplicação se falhar
    }
};




export default db;