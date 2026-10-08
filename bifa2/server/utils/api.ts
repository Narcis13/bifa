import type { H3Event } from 'h3'
import type { z } from 'zod'

/**
 * One error shape for the whole API (h3 JSON error): { statusCode, message, data }.
 * `message` is always Romanian and safe to show; `data.issues` lists field errors on 422.
 */
const REASON: Record<number, string> = { 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 409: 'Conflict', 422: 'Unprocessable Entity' }

export function apiError(statusCode: number, message: string, data?: Record<string, unknown>): never {
  throw createError({ statusCode, statusMessage: REASON[statusCode], message, data })
}

function issues(error: z.ZodError) {
  return error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
}

/** Validates the JSON body; 422 with field issues when invalid. */
export async function validBody<S extends z.ZodType>(event: H3Event, schema: S): Promise<z.output<S>> {
  const r = schema.safeParse(await readBody(event).catch(() => undefined))
  if (!r.success) apiError(422, 'Datele trimise nu sunt valide.', { issues: issues(r.error) })
  return r.data
}

/** Validates the query string; 400 when invalid. */
export function validQuery<S extends z.ZodType>(event: H3Event, schema: S): z.output<S> {
  const r = schema.safeParse(getQuery(event))
  if (!r.success) apiError(400, 'Parametrii cererii nu sunt valizi.', { issues: issues(r.error) })
  return r.data
}

/** Validates the route params; 400 when invalid. */
export function validParams<S extends z.ZodType>(event: H3Event, schema: S): z.output<S> {
  const r = schema.safeParse(getRouterParams(event))
  if (!r.success) apiError(400, 'Parametrii cererii nu sunt valizi.', { issues: issues(r.error) })
  return r.data
}

/** Throws 404 when a service returned nothing. */
export function found<T>(value: T | undefined | null, what = 'Înregistrarea'): T {
  if (value === undefined || value === null) apiError(404, `${what} nu există.`)
  return value
}

/** Maps MySQL constraint errors to 409 instead of 500. */
export function conflictOnDuplicate(e: unknown, message: string): never {
  const err = e as { code?: string, cause?: { code?: string } }
  const code = err.code ?? err.cause?.code
  if (code === 'ER_DUP_ENTRY') apiError(409, message)
  if (code === 'ER_ROW_IS_REFERENCED_2' || code === 'ER_ROW_IS_REFERENCED') apiError(409, 'Înregistrarea este folosită și nu poate fi ștearsă; dezactivați-o.')
  throw e
}

/** Runs a service call and turns its business-rule errors (with `status`) into API errors. */
export async function regula<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  }
  catch (e) {
    const err = e as { status?: number, message?: string }
    if (e instanceof Error && typeof err.status === 'number') apiError(err.status, err.message!)
    throw e
  }
}
