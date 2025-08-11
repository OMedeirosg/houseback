
import { error, info, warning } from "../utils/logger";
import { hashPassword } from "./utils/hash-password";
import { uuidv4 } from "zod";
import db from "../db/connection";
import { v4 } from "uuid";
import { prettify } from "../utils";




interface RegisterServiceResponse {
    message: string;
    status: number;
    data: Record<string,any> | null 
}

export const registerService = async (email: string, name: string, password: string) : Promise<RegisterServiceResponse> => {
    const hashedPassword = await hashPassword(password);
    const uuid = v4()
    const payload = {
        id: uuid,
        name,
        email,
        password: hashedPassword,
        created_at: new Date(),
        updated_at: new Date(),
    }
    try {
         await db("users").insert(payload);

        const data = {
            id: uuid,
            name,
            email,
            created_at: new Date(),
            updated_at: new Date(),
        }

        info(`${prettify(data)}`)

        return {
            message: "Usuário criado com sucesso",
            status: 201,
            data,
                }

    } catch (err) {
        error(`error ${err}`);
        return {
            message: "Erro ao criar usuário",
            status: 500,
            data: null,
        }
    }
}