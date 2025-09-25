// src/lib/firebaseAdmin.ts
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

/**
 * Inicializa Firebase Admin usando variables de entorno.
 * Requiere:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY   (ojo con los \n)
 */
function init() {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error(
      'Faltan variables de entorno de Firebase Admin: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
    )
  }

  // Evitar inicializar múltiples veces en hot-reload
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    })
  }
}

export function db() {
  init()
  return getFirestore()
}

/**
 * Helper: referencia a la colección de usuarios de la app.
 * Estructura sugerida del documento:
 * {
 *   email: string (lowercase, único),
 *   passwordHash: string (bcrypt),
 *   name?: string,
 *   role?: 'owner'|'admin'|'user',
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp,
 *   ...otros metadatos
 * }
 */
export function usersCol() {
  return db().collection('mc_users')
}
