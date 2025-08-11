import { Request, Response } from 'express';
import { registerServiceSchema, RegisterServiceSchema } from '../schema/register-service-schema';
import { registerService } from '../services/auth';
import { success, warning } from '../utils/logger';
import { prettify } from '../utils';


export const registerController = async (req: Request, res: Response) => {

    const {email,name, password}  = req.body;

    const validatedData = registerServiceSchema.safeParse({email,name,password});

    if(!validatedData.success) {
        return res.status(400).json({message: validatedData.error.message});
    }

    try {
        const user = await registerService(email,name,password);
        success(`User created:${prettify(user)}`)

    return   res.status(201).json(user);
    
    } catch (error) {
   return   res.status(500).json({message: "Erro ao cadastrar usuário"});
    }
     
}
