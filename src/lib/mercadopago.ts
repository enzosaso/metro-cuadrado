import { MercadoPagoConfig, PreApproval } from 'mercadopago'

export const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
})

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
}): Promise<string> {
  const suscription = await new PreApproval(mercadopago).create({
    body: {
      back_url: opts.back_url,
      reason: opts.reason,
      auto_recurring: {
        frequency: opts.frequency,
        frequency_type: opts.frequency_type,
        transaction_amount: opts.amount,
        currency_id: 'ARS'
      },
      payer_email: opts.payer_email,
      status: 'pending'
    }
  })
  return suscription.init_point!
}

/** Trae un preapproval por id para verificar estado */
export async function getPreapproval(id: string) {
  return new PreApproval(mercadopago).get({
    id
  })
}
