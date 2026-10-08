import { z } from 'zod'

const camp = (max: number, label: string) =>
  z.string().trim().max(max, `${label}: maxim ${max} de caractere`).default('')

export const setariSchema = z.object({
  institutie: z.string().trim().min(1, 'Denumirea instituției este obligatorie').max(255, 'Instituție: maxim 255 de caractere'),
  grad_dir_fin_con: camp(100, 'Grad director financiar-contabil'),
  nume_dir_fin_con: camp(255, 'Nume director financiar-contabil'),
  grad_comandant: camp(100, 'Grad comandant'),
  nume_comandant: camp(255, 'Nume comandant'),
})
export type SetariInput = z.infer<typeof setariSchema>
