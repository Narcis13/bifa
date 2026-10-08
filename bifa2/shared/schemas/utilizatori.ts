import { z } from 'zod'
import { stare } from './common'

export const ROLURI = ['admin', 'operator'] as const
export const DENUMIRI_ROL: Record<(typeof ROLURI)[number], string> = {
  admin: 'Administrator',
  operator: 'Operator',
}

const rol = z.enum(ROLURI, { message: 'Rol invalid' })

/** Optional text: empty string becomes null (clears the value on update). */
const text = (max: number, label: string) =>
  z.string().trim().max(max, `${label}: maxim ${max} de caractere`).transform(v => (v === '' ? null : v)).nullish()

const email = z.string().trim().max(255, 'E-mail: maxim 255 de caractere')
  .refine(v => v === '' || z.email().safeParse(v).success, 'Adresă de e-mail invalidă')
  .transform(v => (v === '' ? null : v))
  .nullish()

const parola = z.string().min(6, 'Parola trebuie să aibă cel puțin 6 caractere').max(200, 'Parola este prea lungă')

const username = z.string().trim()
  .min(3, 'Numele de utilizator trebuie să aibă cel puțin 3 caractere')
  .max(100, 'Numele de utilizator: maxim 100 de caractere')
  .regex(/^\S+$/, 'Numele de utilizator nu poate conține spații')

export const utilizatorNou = z.object({
  username,
  password: parola,
  name: text(255, 'Nume'),
  email,
  rol: rol.default('operator'),
  stare: stare.default('activ'),
})
export type UtilizatorNou = z.infer<typeof utilizatorNou>

/** Update: the username is immutable; an empty password means "keep the current one". */
export const utilizatorModificat = z.object({
  password: z.string().transform(v => (v === '' ? undefined : v)).pipe(parola.optional()).optional(),
  name: text(255, 'Nume'),
  email,
  rol: rol.optional(),
  stare: stare.optional(),
})
export type UtilizatorModificat = z.infer<typeof utilizatorModificat>
