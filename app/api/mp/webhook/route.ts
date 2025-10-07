import { NextRequest } from 'next/server'
import { getPreapproval } from '@/lib/mercadopago'
import { setUserRoleByEmail } from '@/lib/users'

/**
 * Mercado Pago envía notificaciones con query params como:
 * ?type=preapproval&id=<preapproval_id>
 */
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const type = url.searchParams.get('type')
    const id = url.searchParams.get('id')

    if (type !== 'preapproval' || !id) {
      return new Response('ignored', { status: 200 })
    }

    const pre = await getPreapproval(id)
    // Estados típicos: authorized, paused, cancelled
    const status: string = pre.status
    const email: string | undefined = pre.payer_email || pre.payer?.email || pre.external_reference

    if (email && status === 'authorized') {
      await setUserRoleByEmail(email.toLowerCase(), 'user')
    }

    return new Response('ok', { status: 200 })
  } catch (e) {
    console.error('MP webhook error:', e)
    return new Response('error', { status: 500 })
  }
}

// Aceptar también GET (algunos envíos viejos de MP usan GET)
export const GET = POST
