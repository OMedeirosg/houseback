import { Response, Request } from "express";
import { error, success, warning } from "../../../utils/logger";
import { registerController } from "../../../controllers/authSingup";





export const signupHandler = async (req: Request, res: Response) => {


  success("Signup endpoint hit");

  if (!req.body) {
    return {
      status: 401,
      message: "Houve um erro"
    }
  }

  try {
    const result = await registerController(req, res)

    return result
  } catch (err) {
    error(`erro: ${err}`)
    return {
      status: 500,
      message: "Houve um erro no servidor"
    }
  }
}