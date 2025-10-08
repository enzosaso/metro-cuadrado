const MP_BASE = 'https://api.mercadopago.com'
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

async function mpFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${MP_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`MercadoPago error ${res.status}: ${txt}`)
  }
  return res.json() as Promise<T>
}

/**
 * Crea una suscripción (preapproval) para cobro recurrente.
 * https://www.mercadopago.com.ar/developers/es/reference/subscriptions/_preapproval/post
 */
export async function createPreapproval(opts: {
  payer_email: string
  reason: string
  amount: number // monto por ciclo
  frequency: number // ej: 1
  frequency_type: 'months' | 'days'
  back_url: string // vuelve el usuario
  notification_url: string // webhook (opcional si lo seteás en el panel)
  external_reference: string
}) {
  return mpFetch<{ id: string; init_point: string; sandbox_init_point?: string }>('/preapproval', {
    method: 'POST',
    body: JSON.stringify({
      payer_email: opts.payer_email,
      reason: opts.reason,
      back_url: opts.back_url,
      external_reference: opts.external_reference, // para identificar al usuario
      auto_recurring: {
        frequency: opts.frequency,
        frequency_type: opts.frequency_type, // "months" o "days"
        transaction_amount: opts.amount,
        currency_id: 'ARS'
      },
      status: 'pending',
      notification_url: opts.notification_url // tu webhook público
    })
  })
}

/** Trae un preapproval por id para verificar estado */
export async function getPreapproval(id: string) {
  return mpFetch<{
    id: string
    init_point: string
    sandbox_init_point?: string
    payer_email?: string
    payer?: { email: string }
    external_reference?: string
    status: string
  }>(`/preapproval/${id}`, {
    method: 'GET'
  })
}
