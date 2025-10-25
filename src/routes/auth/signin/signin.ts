import { Request, Response } from "express";
import { error, success, warning } from "../utils/logger";




export const signinHandler = async (req: Request, res: Response) => {

    if (!req.body) {
        return { status: 401, message: "Houve um erro" }
    }

    const { email, password } = req.body;
    if (!email) {
        res.status(406).json({ message: "Email is required" });
    }

    try {
        const result = await loginController(email, password);
        return result
    } catch (error) {
        error(`Error during signin:${error}`);
        return res.json({ message: "Internal server error", STATUS_CODES: 500 });
    }


})