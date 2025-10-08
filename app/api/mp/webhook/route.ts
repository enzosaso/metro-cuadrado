import { NextRequest } from 'next/server'
import { getPreapproval } from '@/lib/mercadopago'
import { setUserRoleById } from '@/lib/users'

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
    const userId = pre?.external_reference as string | undefined

    if (status === 'authorized') {
      if (userId) await setUserRoleById(userId, 'user')
    }

    return new Response('ok', { status: 200 })
  } catch (e) {
    console.error('MP webhook error:', e)
    return new Response('error', { status: 500 })
  }
}

// Aceptar también GET (algunos envíos viejos de MP usan GET)
export const GET = POST
