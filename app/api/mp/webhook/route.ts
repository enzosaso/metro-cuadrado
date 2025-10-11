import { NextRequest } from 'next/server'
import { getPreapproval } from '@/lib/mercadopago'
import { setUserRoleById } from '@/lib/users'

/**
 * Mercado Pago envía notificaciones con query params como:
 * ?type=preapproval&id=<preapproval_id>
 */
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const id = url.searchParams.get('data.id')

    if (type === 'subscription_preapproval') {
      const preapproval = await getPreapproval(id!)
      if (preapproval.status === 'authorized') {
        await setUserRoleById(preapproval.external_reference!, 'user')
      }
      if (preapproval.status === 'cancelled') {
        await setUserRoleById(preapproval.external_reference!, 'guest')
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
