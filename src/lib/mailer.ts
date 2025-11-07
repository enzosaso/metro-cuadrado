export type SendPasswordResetEmailArgs = { to: string; resetUrl: string }

export async function sendPasswordResetEmail({ to, resetUrl }: SendPasswordResetEmailArgs) {
  const provider = process.env.EMAIL_PROVIDER ?? 'log'

  if (provider === 'resend') {
    const { Resend } = await import('resend')
    const key = process.env.RESEND_API_KEY
    const from = process.env.EMAIL_FROM ?? 'no-reply@metrocuadrado.com'
    if (!key) throw new Error('RESEND_API_KEY faltante')
    const resend = new Resend(key)
    await resend.emails.send({
      from,
      to,
      subject: 'Restablecé tu contraseña',
      html: `<p>Para restablecer tu contraseña, hacé clic:</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>
             <p>Vence en 60 minutos.</p>`
    })
    return
  }

  if (provider === 'smtp') {
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
    const from = process.env.EMAIL_FROM ?? 'no-reply@metrocuadrado.com'
    await transporter.sendMail({
      from,
      to,
      subject: 'Restablecé tu contraseña',
      html: `<p>Para restablecer tu contraseña, hacé clic:</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>
             <p>Vence en 60 minutos.</p>`
    })
    return
  }

  // Dev por defecto

  console.log(`[DEV] Password reset link for ${to}: ${resetUrl}`)
}
