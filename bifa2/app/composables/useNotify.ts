import { useToast } from 'primevue/usetoast'

/** Toasts for results and API errors (the API always sends a Romanian `message`). */
export function useNotify() {
  const toast = useToast()
  return {
    ok(detail: string) {
      toast.add({ severity: 'success', summary: 'Succes', detail, life: 3000 })
    },
    warn(detail: string) {
      toast.add({ severity: 'warn', summary: 'Atenție', detail, life: 6000 })
    },
    err(e: unknown) {
      const err = e as { data?: { message?: string, data?: { issues?: { message: string }[] } }, message?: string }
      const issues = err.data?.data?.issues?.map(i => i.message).join('; ')
      const detail = [err.data?.message ?? err.message ?? 'Eroare necunoscută', issues].filter(Boolean).join(': ')
      toast.add({ severity: 'error', summary: 'Eroare', detail, life: 6000 })
    },
  }
}
