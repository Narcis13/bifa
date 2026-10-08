import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Introduceți utilizatorul'),
  password: z.string().min(1, 'Introduceți parola'),
})
export type LoginInput = z.infer<typeof loginSchema>
