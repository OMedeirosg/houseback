import { z } from "zod";

export const registerServiceSchema = z.object({
    email: z.email("Invalid Email"),
    name: z.string("Name invalid or required").min(3),
    password: z.string("Password invalid").min(8),
});

export type RegisterServiceSchema = z.infer<typeof registerServiceSchema>;