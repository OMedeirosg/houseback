import { Response, Request } from "express";
import {  registerController } from "../../controllers/auth";
import { error, success, warning } from "../../utils/logger";





export const signupHandler =  async (req: Request , res:Response ) => {

  
  success("Signup endpoint hit");
  
        if(!req.body){
            return {
                status:401,
                message: "Houve um erro"
            }
        }

        try {
           const result = await registerController(req, res) 

           return result
        } catch (err) {
            error(`erro: ${err}`)
          return res.json({
            message: "Erro ao cadastrar conta",
            STATUS_CODES: 500,
          })  
        }
}