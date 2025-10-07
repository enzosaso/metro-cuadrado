import { usersCol } from '@/lib/firebaseAdmin'

export async function setUserRoleByEmail(email: string, role: 'guest' | 'user' | 'admin' | 'owner') {
  const snap = await usersCol().where('email', '==', email.toLowerCase()).limit(1).get()
  if (snap.empty) return false
  const doc = snap.docs[0]
  if (!doc) return false
  await doc.ref.update({ role, updatedAt: new Date() })
  return true
}

export async function setUserRoleById(id: string, role: 'guest' | 'user' | 'admin' | 'owner') {
  await usersCol().doc(id).update({ role, updatedAt: new Date() })
  return true
}
