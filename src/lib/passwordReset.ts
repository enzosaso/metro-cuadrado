import { createHash, randomBytes } from 'crypto'
import { Timestamp, type FirestoreDataConverter, type QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { db, usersCol } from './firebaseAdmin'

const COLLECTION = 'mc_password_resets'

// ===== Tipos =====
export type PasswordResetDoc = {
  uid: string
  email: string
  tokenHash: string
  createdAt: Timestamp
  expiresAt: Timestamp
  consumedAt?: Timestamp | null
  ip?: string | null
  ua?: string | null
}

type IssueOpts = {
  ttlMinutes?: number
  ip?: string
  ua?: string
  baseUrl?: string
}

export type IssueResult = {
  token: string | null
  resetUrl: string | null
}

type UserDoc = {
  email: string
}

// ===== Converters =====
const passwordResetConverter: FirestoreDataConverter<PasswordResetDoc> = {
  toFirestore: (data: PasswordResetDoc) => data,
  fromFirestore(snap: QueryDocumentSnapshot): PasswordResetDoc {
    const data = snap.data()
    return {
      uid: data.uid,
      email: data.email,
      tokenHash: data.tokenHash,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
      ...(data.consumedAt && { consumedAt: data.consumedAt }),
      ...(data.ip && { ip: data.ip }),
      ...(data.ua && { ua: data.ua })
    }
  }
}

const userConverter: FirestoreDataConverter<UserDoc> = {
  toFirestore: (data: UserDoc) => data,
  fromFirestore(snap: QueryDocumentSnapshot): UserDoc {
    const data = snap.data()
    return { email: data.email }
  }
}

// ===== Utils =====
function col() {
  return db().collection(COLLECTION).withConverter(passwordResetConverter)
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function normEmail(email: string) {
  return email.trim().toLowerCase()
}

// ===== API =====
export async function issuePasswordReset(emailRaw: string, opts?: IssueOpts): Promise<IssueResult> {
  const email = normEmail(emailRaw)
  const ttlMs = (opts?.ttlMinutes ?? 60) * 60 * 1000

  const users = usersCol().withConverter(userConverter)
  const snap = await users.where('email', '==', email).limit(1).get()

  if (snap.empty) {
    return { token: null, resetUrl: null }
  }

  const userDoc = snap.docs[0]
  if (!userDoc) {
    return { token: null, resetUrl: null }
  }
  const uid = userDoc.id
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const now = Timestamp.now()
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + ttlMs))

  await col().add({
    uid,
    email,
    tokenHash,
    createdAt: now,
    expiresAt,
    consumedAt: null,
    ip: opts?.ip ?? null,
    ua: opts?.ua ?? null
  })

  const resetUrl = opts?.baseUrl
    ? `${opts.baseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`
    : null

  return { token, resetUrl }
}

export async function verifyPasswordResetToken(token: string): Promise<{ docId: string; uid: string; email: string }> {
  const tokenHash = hashToken(token)
  const q = await col().where('tokenHash', '==', tokenHash).limit(1).get()
  if (q.empty) throw new Error('token inválido')

  const doc = q.docs[0]!
  const data = doc.data() // Typed: PasswordResetDoc

  if (data.consumedAt) throw new Error('token ya usado')

  const now = Timestamp.now()
  if (data.expiresAt.toMillis() <= now.toMillis()) throw new Error('token expirado')

  return { docId: doc.id, uid: data.uid, email: data.email }
}

export async function consumePasswordReset(docId: string): Promise<void> {
  await col().doc(docId).update({ consumedAt: Timestamp.now() })
}

export function buildResetUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`
}
