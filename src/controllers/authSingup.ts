import { Request, Response } from 'express';
import { registerService } from '../services/signin/auth';
import { success, warning } from '../utils/logger';
import { prettify } from '../utils';
import { registerServiceSchema } from '../schema/register-service-schema';


export const registerController = async (req: Request, res: Response) => {

    const { email, name, password } = req.body


    const validatedData = registerServiceSchema.safeParse({ email, name, password });

    if (!validatedData.success) {
        return {
            status: 400,
            message: "Dados inválidos",
        }
    }

    try {
        const user = await registerService(email, name, password);
        success(`User created:${prettify(user)}`)
        return user

    } catch (error) {
        warning(`Error registering user: ${error}`);
        return {
            status: 500,
            message: "Erro ao cadastrar usuário",
        };


    }

}
