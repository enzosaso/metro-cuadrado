import { NextRequest } from 'next/server'
import { getPreapproval } from '@/lib/mercadopago'
import { setUserRoleByPayerEmail } from '@/lib/users'

/**
 * Mercado Pago envía notificaciones con query params como:
 * ?type=preapproval&id=<preapproval_id>
 */
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const id = url.searchParams.get('id')

    if (type === 'subscription_preapproval') {
      const preapproval = await getPreapproval(id!)

      if (preapproval.status === 'authorized') {
        await setUserRoleByPayerEmail(preapproval.payer_email!, 'user')
      }
    }

    return new Response('ok', { status: 200 })
  } catch (e) {
    console.error('MP webhook error:', e)
    return new Response('error', { status: 500 })
  }
}

// Aceptar también GET (algunos envíos viejos de MP usan GET)
export const GET = POST
